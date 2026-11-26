import { useId, useState, type ReactNode } from "react"
import { assertNever } from "../assertNever"
import { Choice } from "../components/Choice"
import { Lemma } from "../components/Lemma"
import { notesFor } from "../material/notes"
import type { Substrate } from "../material/types"
import { annotationsOf } from "../practice/editorsNotes"
import type { StepPlace } from "../practice/places"
import type { Problem } from "../practice/problems"
import type { EditorsNote, Practice, Recall, Writing } from "../practice/types"
import "../reader/praxisBar/praxisBar.css"
import { CardTools } from "./CardTools"
import { Confirm } from "./Confirm"
import type { Edit } from "./edits"
import { paragraphsOf, proseText } from "./prose"
import { placeAbove, placeBelow } from "./selection"
import { isBroken, partOf, recallLabel, recallTargets, romanOf, type PartName } from "./summary"

/** What the reader does after the prose, for each part a step may ask, as one sentence says it. */
const THEN: readonly { part: PartName | "none"; words: string }[] = [
  { part: "none", words: "goes on" },
  { part: "highlight", words: "looks at notes in the poem" },
  { part: "writing", words: "writes a response" },
  { part: "recall", words: "reads back what they wrote" },
]

/** What the card needs of the desk for a highlighting step: the form for its note, new or taken
 * up (none while it is docked at the foot of a page); the note in hand, if any; and the way to take
 * a note up, from the card's list or by a tap on it in the poem. */
export interface NotesHandle {
  form: ReactNode
  inHand: string | null
  onTakeUp: (index: number) => void
}

/** The card for a step, set as the reader will see it in the praxis bar: its stage's name, where
 * it is in the stage, and its prose, written in a box at the size it is read; then one sentence for
 * what the reader does next, which is the part the step asks besides its prose, and what that part
 * is about. A highlighting step lists its notes, each with what is wrong with it, to be taken up and
 * edited, and then the form for a note. In its corner, moving it and removing it, asked first.
 * Highlighting chosen before any note is written is held by the desk (`highlighting`), since a step
 * with no notes does not highlight; leaving it while the step has notes asks first, as the notes
 * go. */
export function StepCard({
  practice,
  at,
  problems,
  substrate,
  highlighting,
  onHighlighting,
  edit,
  onRemove,
  notes,
}: {
  practice: Practice
  at: StepPlace
  problems: readonly Problem[]
  substrate: Substrate
  highlighting: boolean
  onHighlighting: (on: boolean) => void
  edit: (edit: Edit) => void
  onRemove: () => void
  notes: NotesHandle
}) {
  const then = useId()
  const proseBox = useId()
  const [removing, setRemoving] = useState(false)
  const [leaving, setLeaving] = useState<PartName | "none" | null>(null)
  const stage = practice.stages[at.stage]
  const step = stage?.steps[at.step]
  if (stage === undefined || step === undefined) return null

  const part = partOf(step) ?? (highlighting ? "highlight" : null)
  const targets = recallTargets(practice, at)
  const here = problems.filter((p) => p.stage === at.stage && p.step === at.step && isBroken(p))
  const recallProblem = here.find((p) => p.about === "recall")?.text ?? null
  const above = placeAbove(practice, at)
  const below = placeBelow(practice, at)

  const setParts = (parts: {
    highlight?: readonly EditorsNote[]
    writing?: Writing | null
    recall?: Recall | null
  }) =>
    edit({
      kind: "setParts",
      at,
      highlight: parts.highlight ?? [],
      writing: parts.writing ?? null,
      recall: parts.recall ?? null,
    })

  /** Switches the step to another part, keeping what it asked if it asked it already. */
  const switchTo = (next: PartName | null) => {
    onHighlighting(next === "highlight")
    switch (next) {
      case "highlight":
        return setParts({ highlight: step.highlight })
      case "writing":
        return setParts({ writing: step.writing ?? { target: "whole", tags: [], count: "one" } })
      case "recall": {
        const nearest = targets.findLast((t) => t.recall.from === "step") ?? targets.at(-1)
        return setParts({ recall: step.recall ?? nearest?.recall ?? null })
      }
      case null:
        return setParts({})
      default:
        return assertNever(next)
    }
  }

  const choose = (next: PartName | null) => {
    if (next === part) return
    if (step.highlight.length > 0 && next !== "highlight") setLeaving(next ?? "none")
    else switchTo(next)
  }

  return (
    <section
      className="praxis-bar form-card"
      aria-label={`Step ${at.step + 1} of stage ${romanOf(at.stage + 1)}`}
    >
      <CardTools
        what={`step ${at.step + 1}`}
        onUp={above === null ? null : () => edit({ kind: "moveStep", from: at, to: above })}
        onDown={below === null ? null : () => edit({ kind: "moveStep", from: at, to: below })}
        onRemove={() => setRemoving(true)}
      />
      <div className="praxis-head">
        <h2 className="praxis-heading">
          {stage.name.trim() === "" ? `Stage ${romanOf(at.stage + 1)}` : stage.name}
        </h2>
        <span className="praxis-position">
          step {at.step + 1} of {stage.steps.length}
        </span>
      </div>
      <div className="praxis-steps" aria-hidden="true">
        {stage.steps.map((_, i) => (
          <i key={i} data-at={i < at.step ? "done" : i === at.step ? "here" : "ahead"} />
        ))}
      </div>
      {removing && (
        <Confirm
          question={`Remove step ${at.step + 1} of stage ${romanOf(at.stage + 1)}?`}
          yes="Remove"
          onYes={() => {
            setRemoving(false)
            onRemove()
          }}
          onNo={() => setRemoving(false)}
        />
      )}

      <div>
        <div className="form-field-head">
          <label className="form-label" htmlFor={proseBox}>
            the reader is told
          </label>
          <span className="form-hint">A blank line starts a paragraph.</span>
        </div>
        <ProseBox
          id={proseBox}
          prose={step.prose}
          onChange={(paragraphs) => edit({ kind: "setProse", at, prose: paragraphs })}
        />
      </div>

      <p className="form-then">
        <span id={then}>Then the reader</span>{" "}
        <Choice
          labelledBy={then}
          value={part ?? "none"}
          options={THEN.map((option) => ({
            key: option.part,
            label: option.words,
            disabled: option.part === "recall" && part !== "recall" && targets.length === 0,
          }))}
          onChange={(key) => {
            const next = THEN.find((option) => option.part === key)?.part
            if (next !== undefined) choose(next === "none" ? null : next)
          }}
        />
        {part === "writing" && step.writing !== null && (
          <>
            {" "}
            <WritingAbout writing={step.writing} onChange={(writing) => setParts({ writing })} />
          </>
        )}
        {part === "recall" && step.recall !== null && (
          <>
            {" in "}
            <RecallFrom
              practice={practice}
              recall={step.recall}
              targets={targets}
              broken={recallProblem !== null}
              onChange={(recall) => setParts({ recall })}
            />
          </>
        )}
      </p>
      {part === "recall" && recallProblem !== null && (
        <p className="form-problem">{recallProblem}</p>
      )}
      {leaving !== null && (
        <Confirm
          question={`Remove this step's ${step.highlight.length} ${step.highlight.length === 1 ? "note" : "notes"}?`}
          yes="Remove notes"
          onYes={() => {
            setLeaving(null)
            switchTo(leaving === "none" ? null : leaving)
          }}
          onNo={() => setLeaving(null)}
        />
      )}

      {part === "highlight" && (
        <>
          <StepNotes
            notes={step.highlight}
            inHand={notes.inHand}
            substrate={substrate}
            problems={problems.filter(
              (p) => p.stage === at.stage && p.step === at.step && p.note !== null,
            )}
            onTakeUp={notes.onTakeUp}
          />
          {notes.form}
        </>
      )}

      {here
        .filter((p) => p.note === null && p.about !== "recall")
        .map((problem, i) => (
          <p key={i} className="form-problem">
            {problem.text}
          </p>
        ))}
    </section>
  )
}

/** The step's prose, written where the reader will read it. It keeps what is typed, and gives the
 * draft its paragraphs; whenever the draft's paragraphs are not what the box says, as when the draft
 * changes elsewhere, it shows the draft's. */
function ProseBox({
  id,
  prose,
  onChange,
}: {
  id: string
  prose: readonly string[]
  onChange: (prose: string[]) => void
}) {
  const [text, setText] = useState(() => proseText(prose))
  const shown = sameParagraphs(paragraphsOf(text), prose) ? text : proseText(prose)
  return (
    <textarea
      id={id}
      className="form-prose"
      rows={3}
      value={shown}
      placeholder="What the reader is told at this step"
      onChange={(event) => {
        setText(event.target.value)
        const paragraphs = paragraphsOf(event.target.value)
        if (!sameParagraphs(paragraphs, prose)) onChange(paragraphs)
      }}
    />
  )
}

function sameParagraphs(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((paragraph, i) => paragraph === b[i])
}

/** What a response is about, ending the sentence: the whole poem, or passages the reader chooses. */
function WritingAbout({
  writing,
  onChange,
}: {
  writing: Writing
  onChange: (writing: Writing) => void
}) {
  return (
    <Choice
      label="What the response is on"
      value={writing.target}
      options={[
        { key: "whole", label: "on the whole poem" },
        { key: "chosen", label: "on passages they choose" },
      ]}
      onChange={(key) => onChange({ ...writing, target: key === "chosen" ? "chosen" : "whole" })}
    />
  )
}

/** What a recall brings back, ending the sentence: one of the earlier stages and steps it may
 * name. One it names that it may not, as when what it named was removed or moved after it, is
 * listed first, and marked broken. */
function RecallFrom({
  practice,
  recall,
  targets,
  broken,
  onChange,
}: {
  practice: Practice
  recall: Recall
  targets: readonly { recall: Recall; label: string }[]
  broken: boolean
  onChange: (recall: Recall) => void
}) {
  const same = (a: Recall, b: Recall) =>
    a.from === b.from && (a.from === "all" || (b.from !== "all" && a.id === b.id))
  const listed = targets.some((target) => same(target.recall, recall))
  const options = listed ? targets : [{ recall, label: recallLabel(practice, recall) }, ...targets]
  const chosen = options.findIndex((option) => same(option.recall, recall))
  return (
    <Choice
      label="What the recall brings back"
      broken={broken}
      value={String(chosen)}
      options={options.map((option, i) => ({ key: String(i), label: option.label }))}
      onChange={(key) => {
        const option = options[Number(key)]
        if (option !== undefined) onChange(option.recall)
      }}
    />
  )
}

/** The step's notes, as the margin prints them: each by its lemma, or its notehead when it cannot
 * be placed, then its words, cut at three lines, its notehead, Edit, which takes it up to be put
 * right, and what is wrong with it, if anything. The note in hand is being written in the form
 * under the list, and is left out. Nothing, when the step has no notes but the one in hand. */
function StepNotes({
  notes,
  inHand,
  substrate,
  problems,
  onTakeUp,
}: {
  notes: readonly EditorsNote[]
  inHand: string | null
  substrate: Substrate
  problems: readonly Problem[]
  onTakeUp: (index: number) => void
}) {
  const heading = useId()
  const listed = notes
    .map((note, n) => ({ note, n, problems: problems.filter((p) => p.note === n) }))
    .filter(({ note }) => note.id !== inHand)
  if (listed.length === 0) return null
  const placed = notesFor(substrate, annotationsOf(substrate, notes)).notes
  return (
    <div>
      <div className="form-list-head">
        <h3 className="form-label" id={heading}>
          the editor’s notes · {notes.length}
        </h3>
        <span className="form-hint">Or tap a note in the poem</span>
      </div>
      <ul className="form-notes" aria-labelledby={heading}>
        {listed.map(({ note, n, problems: found }) => {
          const lemma = placed.find((each) => each.id === note.id)
          const words = lemma?.lemma.map((part) => part.text).join(" · ") ?? note.notehead
          return (
            <li key={`${n}:${note.id}`} className="form-note">
              <p className="form-lemma">
                {lemma === undefined ? <code>{note.notehead}</code> : <Lemma lemma={lemma.lemma} />}
                <span className="note-close-mark" aria-hidden="true">
                  {" ]"}
                </span>
              </p>
              {note.body.trim() !== "" && <p className="form-note-body">{note.body}</p>}
              <div className="form-note-foot">
                <code className="form-notehead">{note.notehead}</code>
                <button
                  type="button"
                  className="form-tool"
                  aria-label={`Edit the note on ${words}`}
                  onClick={() => onTakeUp(n)}
                >
                  edit
                </button>
              </div>
              {found.map((problem, i) => (
                <p key={i} className="form-problem">
                  {problem.text}
                </p>
              ))}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
