import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { assertNever } from "../assertNever"
import { BackLink } from "../components/BackLink"
import { Button } from "../components/controls"
import { Dock } from "../components/Dock"
import { Folio, FolioText, Message } from "../components/Folio"
import { usePlatform, type PageOrSpread } from "../components/usePlatform"
import { loadTextualComplex } from "../loom/load"
import { toMaterial } from "../loom/toMaterial"
import type { Material } from "../material/materials"
import { spansOfNotehead } from "../material/noteheads"
import type { TextId } from "../material/types"
import { loadPractices } from "../practice/load"
import { stageIndexOf, stepPlaceOf } from "../practice/places"
import { problemsOf } from "../practice/problems"
import type { Practice, StepId } from "../practice/types"
import { NotingPage } from "../reader/praxisBar/NotingPage"
import type { ViewerProtocol } from "../reader/scenes/types"
import { useScene, type SceneHandle } from "../reader/scenes/useScene"
import { ViewerPage } from "../reader/viewer/Viewer"
import { formHref, libraryHref, readerHref, replaceHref } from "../route"
import { useLoaded } from "../useLoaded"
import { Anatomy } from "./Anatomy"
import { Confirm } from "./Confirm"
import { nextStageId, nextStepId } from "./edits"
import { editOfNote, makerFrame } from "./makerFrame"
import { PracticeHead, PracticeName } from "./PracticeHead"
import {
  firstSelection,
  firstUnfinished,
  isInDraft,
  selectionAfterRemoving,
  type Selection,
} from "./selection"
import { StageCard } from "./StageCard"
import { StepCard } from "./StepCard"
import { romanOf } from "./summary"
import { useDraft, type Draft } from "./useDraft"
import { useMadePractices } from "./useMadePractices"
import "./formPractice.css"

// The practice files, read once
const practiceFiles = loadPractices()

/** One file's material, made from its textual complex. */
async function loadMaterial(file: string): Promise<Material> {
  return toMaterial(await loadTextualComplex(file))
}

/** Form Practice for one text, a desk: a bar across the top, and under it, on a spread, three
 * columns: the reel (the practice's name and its contents), the poem as the reader sees what is
 * selected, and the card of the stage or step selected; on a page, the same one under another, the
 * contents folded. Opened `fresh`, at its address for a new practice, it starts a new practice, and
 * then forgets that it was asked, so that coming back to it does not start another. App gives it a
 * key of its file, so another file is another Form Practice. */
export function FormPractice({ file, fresh }: { file: TextId; fresh: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const { layout, input } = usePlatform(ref)
  const { value: material, error } = useLoaded(file, loadMaterial)
  const made = useMadePractices(file)
  const draft = useDraft(file, practiceFiles.practices, made, fresh)

  // A new practice is asked for once: the address goes back to Form Practice's own
  useEffect(() => {
    if (fresh) replaceHref(formHref(file))
  }, [fresh, file])

  // The tab names Form Practice and the poem while it is open, and goes back when it closes
  useEffect(() => {
    if (material === null) return
    const previous = document.title
    document.title = `Edit practice · ${material.poem.title} · Anthos`
    return () => {
      document.title = previous
    }
  }, [material])

  return (
    <Folio ref={ref} layout={layout} input={input} className="form-practice">
      {material === null ? (
        <FolioText top={<BackLink href={libraryHref}>Library</BackLink>}>
          <Message>{error ?? "Loading…"}</Message>
        </FolioText>
      ) : (
        <Maker file={file} material={material} draft={draft} layout={layout} />
      )}
    </Folio>
  )
}

/** Form Practice once the poem is loaded: what is selected, the scene that shows the poem with the
 * selected step's notes, the top bar, the reel and the card of the stage or step selected. A step's
 * notes are in the poem and listed on its card: a tap on one, or its Edit, takes it up into the
 * card's form, its passages chosen again and its words in the box, to be saved in its place or
 * removed; Add a note opens the form for a new one. Save, with something unfinished, saves nothing,
 * says how many things there are to put right, and goes to the first: the name, or the first stage
 * or step with a problem. */
function Maker({
  file,
  material,
  draft,
  layout,
}: {
  file: TextId
  material: Material
  draft: Draft
  layout: PageOrSpread
}) {
  const { practice, edit } = draft
  const { substrate } = material
  const [chosen, setChosen] = useState<Selection | null>(() => firstSelection(practice))
  // The step for which Highlighting was chosen while it has no note, while it stays selected
  const [highlighting, setHighlighting] = useState<StepId | null>(null)
  // The editor's note taken up in the noting, on the step selected, and whether removing it is asked
  const [inHand, setInHand] = useState<{ step: StepId; id: string } | null>(null)
  const [removingNote, setRemovingNote] = useState(false)
  // What kept the last save from being kept, until the next
  const [refused, setRefused] = useState<string[]>([])
  // Whether Save found things to put right, until there are none
  const [short, setShort] = useState(false)
  const title = useRef<HTMLInputElement>(null)
  // The way to the scene, for its own effects to speak back to it, kept once the scene is drawn
  const toScene = useRef<SceneHandle["toScene"] | null>(null)

  // Whatever was selected and is gone, as after Discard: the first there is
  const selection =
    chosen !== null && isInDraft(practice, chosen) ? chosen : firstSelection(practice)
  const select = (next: Selection | null) => {
    setChosen(next)
    setHighlighting(null)
    setInHand(null)
    setRemovingNote(false)
  }

  const problems = useMemo(() => problemsOf(practice, substrate), [practice, substrate])
  if (short && problems.length === 0) setShort(false)
  const stepId = selection?.kind === "step" ? selection.id : null
  const at = stepId === null ? null : stepPlaceOf(practice, stepId)
  const step = at === null ? undefined : practice.stages[at.stage]?.steps[at.step]
  // The step highlights, or is about to: it has notes, or Highlighting was chosen for it
  const noting = step !== undefined && (step.highlight.length > 0 || highlighting === step.id)
  const held = noting && inHand !== null && inHand.step === stepId ? inHand.id : null
  const subject = useMemo(
    () => makerFrame(practice, stepId, material, { noting, inHand: held }),
    [practice, stepId, material, noting, held],
  )

  // A note the noting sends out: the note in hand, saved in its place, or a new one added; either
  // way it is written, so nothing more is chosen for it, and the form folds up
  const scene = useScene(subject, (effect) => {
    switch (effect.kind) {
      case "note": {
        if (at !== null) {
          const change = editOfNote(practice, at, held, effect, substrate)
          if (change !== null) edit(change)
        }
        setInHand(null)
        toScene.current?.praxisBar({ kind: "choosing", on: false })
        return
      }
      case "revise":
      case "withdraw":
        // The editor's notes are not the reader's: the scene never sends these out here
        return
      default:
        return assertNever(effect)
    }
  })
  useLayoutEffect(() => {
    toScene.current = scene.toScene
  }, [scene.toScene])
  const materials = useMemo(() => materialsOf(file, material), [file, material])

  const page = scene.praxisBar?.noting ?? null
  // A note is being written: taken up, or new and begun
  const composing =
    page !== null &&
    (held !== null || page.choosing || page.chosen.length > 0 || page.draft.trim() !== "")

  /** Takes a note of the step up in the noting, to edit it: its passages, as its notehead places
   * them (none, if it cannot be placed), chosen again, and its words in the box. */
  const takeUp = (index: number) => {
    const note = step?.highlight[index]
    if (step === undefined || note === undefined) return
    const placed = spansOfNotehead(substrate, note.notehead)
    setInHand({ step: step.id, id: note.id })
    setRemovingNote(false)
    scene.toScene.praxisBar({
      kind: "takeUp",
      targets: "spans" in placed ? placed.spans : [],
      text: note.body,
    })
    scene.toScene.praxisBar({ kind: "choosing", on: true })
  }

  /** Puts down the note being written, unchanged: the form empty and folded up. */
  const putDown = () => {
    setInHand(null)
    setRemovingNote(false)
    scene.toScene.praxisBar({ kind: "takeUp", targets: [], text: "" })
    scene.toScene.praxisBar({ kind: "choosing", on: false })
  }

  /** Removes the note in hand. A step whose only note it was stays on Highlighting, for another. */
  const removeInHand = () => {
    if (at === null || step === undefined || held === null) return
    const index = step.highlight.findIndex((note) => note.id === held)
    if (index !== -1) edit({ kind: "removeNote", at, index })
    if (step.highlight.length === 1) setHighlighting(step.id)
    putDown()
  }

  // The poem: a tap on a note's highlight takes the note up, unless a note is being written, when
  // the tap goes no further; a passage chosen goes to the scene
  const toViewer = (message: ViewerProtocol["toScene"]) => {
    switch (message.kind) {
      case "tapNote": {
        if (composing) return
        const id = subject.commentary.notes.find((note) => note.index === message.note)?.id
        const index = step?.highlight.findIndex((note) => note.id === id) ?? -1
        if (index !== -1) takeUp(index)
        return
      }
      case "closeNote":
      case "deleteNote":
        return
      case "choose":
        return scene.toScene.viewer(message)
      default:
        return assertNever(message)
    }
  }

  // The form for the step's note: Add a note, folded up; the new note, or the note taken up, with
  // Remove; or the question whether to remove it. On a page, while passages are chosen, it is docked
  // at the foot, so that the poem and the box are both in reach
  const docked = layout === "page" && page !== null && page.choosing
  let form: ReactNode = null
  if (page !== null) {
    if (held !== null && removingNote) {
      form = (
        <Confirm
          question="Remove this note?"
          yes="Remove"
          onYes={removeInHand}
          onNo={() => setRemovingNote(false)}
        />
      )
    } else if (composing) {
      form = (
        <div className="form-compose">
          <p className="form-compose-head">
            <span className="form-compose-what">{held === null ? "new note" : "the note"}</span>
            <span className="form-hint">Choose its passages in the poem</span>
          </p>
          <NotingPage
            page={page}
            send={scene.toScene.praxisBar}
            label="Its words"
            submit={held === null ? "Add note" : "Save note"}
            hand="editor"
            onCancel={putDown}
            actions={
              held === null ? undefined : (
                <Button className="form-remove-note" onClick={() => setRemovingNote(true)}>
                  Remove
                </Button>
              )
            }
          />
        </div>
      )
    } else {
      form = (
        <Button
          className="form-add-note"
          onClick={() => scene.toScene.praxisBar({ kind: "choosing", on: true })}
        >
          Add a note
        </Button>
      )
    }
  }

  /** Goes to the first thing to put right: the name, or the first stage or step with a problem. */
  const toUnfinished = () => {
    const [first] = problems
    if (first === undefined) return
    if (first.about === "title") {
      title.current?.focus()
      return
    }
    const where = firstUnfinished(practice, problems)
    if (where !== null) select(where)
  }

  const save = () => {
    if (problems.length === 0) {
      setShort(false)
      setRefused(draft.save(substrate))
      return
    }
    setRefused([])
    setShort(true)
    toUnfinished()
  }

  const addStage = () => {
    const id = nextStageId(practice)
    edit({ kind: "addStage", at: practice.stages.length, id, name: "" })
    select({ kind: "stage", id })
  }

  const addStep = (stage: number) => {
    const id = nextStepId(practice)
    const place = { stage, step: practice.stages[stage]?.steps.length ?? 0 }
    edit({ kind: "addStep", at: place, id })
    select({ kind: "step", id })
  }

  const remove = () => {
    if (selection === null) return
    const after = selectionAfterRemoving(practice, selection)
    if (selection.kind === "stage") {
      const stage = stageIndexOf(practice, selection.id)
      if (stage !== null) edit({ kind: "removeStage", stage })
    } else if (at !== null) {
      edit({ kind: "removeStep", at })
    }
    select(after)
  }

  let card: ReactNode = null
  if (selection?.kind === "stage") {
    const stage = stageIndexOf(practice, selection.id)
    if (stage !== null) {
      card = (
        <StageCard
          key={selection.id}
          practice={practice}
          stage={stage}
          problems={problems}
          edit={edit}
          onRemove={remove}
          onSelect={select}
        />
      )
    }
  } else if (selection?.kind === "step" && at !== null) {
    card = (
      <StepCard
        key={selection.id}
        practice={practice}
        at={at}
        problems={problems}
        substrate={substrate}
        highlighting={highlighting === selection.id}
        onHighlighting={(on) => {
          setHighlighting(on ? selection.id : null)
          setInHand(null)
          setRemovingNote(false)
        }}
        edit={edit}
        onRemove={remove}
        notes={{ form: docked ? null : form, inHand: held, onTakeUp: takeUp }}
      />
    )
  }

  const steps = practice.stages.reduce((n, stage) => n + stage.steps.length, 0)
  const contents = (
    <Anatomy
      practice={practice}
      problems={problems}
      selection={selection}
      onSelect={select}
      onAddStage={addStage}
      onAddStep={addStep}
    />
  )

  return (
    <>
      <PracticeHead
        draft={draft}
        readHref={readerHref(file)}
        unfinished={short ? problems.length : 0}
        refused={refused}
        onSave={save}
        onNext={toUnfinished}
      />
      <div className="form-reel">
        <PracticeName draft={draft} poem={material.poem} titleRef={title} />
        {layout === "spread" ? (
          contents
        ) : (
          <details className="form-fold">
            <summary>
              contents · {steps} {steps === 1 ? "step" : "steps"}
            </summary>
            {contents}
          </details>
        )}
      </div>
      <FolioText top={<p className="form-caption">{captionOf(practice, selection, composing)}</p>}>
        <ViewerPage projection={scene.viewer} materials={materials} send={toViewer} />
      </FolioText>
      <div className="form-card-column">{card}</div>
      {docked && (
        <Dock>
          <section className="praxis-bar" aria-label="The note">
            {form}
          </section>
        </Dock>
      )}
    </>
  )
}

/** The line over the poem, saying what it shows: the stage or step selected as the reader sees it,
 * or, while a note is being written, where its passages are chosen. */
function captionOf(practice: Practice, selection: Selection | null, composing: boolean): string {
  if (composing) return "Choose the note's passages in the poem"
  if (selection === null) return "The poem"
  if (selection.kind === "stage") {
    const stage = stageIndexOf(practice, selection.id)
    return stage === null ? "The poem" : `The poem as stage ${romanOf(stage + 1)} opens`
  }
  const at = stepPlaceOf(practice, selection.id)
  return at === null
    ? "The poem"
    : `Step ${at.step + 1} of stage ${romanOf(at.stage + 1)}, as the reader sees it`
}

/** The texts the viewer can draw: only this one. */
function materialsOf(file: TextId, material: Material) {
  return (text: string) => (text === file ? material : null)
}
