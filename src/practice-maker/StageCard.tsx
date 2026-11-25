import { useId, useState } from "react"
import type { Problem } from "../practice/problems"
import type { Practice } from "../practice/types"
import "../reader/praxisBar/praxisBar.css"
import { CardTools } from "./CardTools"
import { Confirm } from "./Confirm"
import type { Edit } from "./edits"
import type { Selection } from "./selection"
import { excerptOf, isBroken, partWord, romanOf } from "./summary"

/** The card for a stage: in its corner, moving it and removing it, asked first; its numeral over
 * its name, written in place; when it opens, from the start, for the first, or so many days after
 * the stage before is finished; what is written wrong in it; and its steps, each by its number, the
 * start of its prose and its part, a way to select it. */
export function StageCard({
  practice,
  stage: s,
  problems,
  edit,
  onRemove,
  onSelect,
}: {
  practice: Practice
  stage: number
  problems: readonly Problem[]
  edit: (edit: Edit) => void
  onRemove: () => void
  onSelect: (selection: Selection) => void
}) {
  const stepsHeading = useId()
  const [removing, setRemoving] = useState(false)
  const stage = practice.stages[s]
  if (stage === undefined) return null
  const steps = stage.steps.length
  const wrong = problems.filter((p) => p.stage === s && p.step === null && isBroken(p))
  const numeral = romanOf(s + 1)

  return (
    <section className="praxis-bar form-card" aria-label={`Stage ${numeral}`}>
      <CardTools
        what={`stage ${numeral}`}
        onUp={s === 0 ? null : () => edit({ kind: "moveStage", from: s, to: s - 1 })}
        onDown={
          s === practice.stages.length - 1
            ? null
            : () => edit({ kind: "moveStage", from: s, to: s + 1 })
        }
        onRemove={() => setRemoving(true)}
      />
      {removing && (
        <Confirm
          question={
            steps === 0
              ? `Remove stage ${numeral}?`
              : `Remove stage ${numeral} and its ${steps} ${steps === 1 ? "step" : "steps"}?`
          }
          yes="Remove"
          onYes={() => {
            setRemoving(false)
            onRemove()
          }}
          onNo={() => setRemoving(false)}
        />
      )}
      <div className="form-stage-head">
        <span className="form-numeral">stage {numeral}</span>
        <input
          className="form-stage-name"
          type="text"
          value={stage.name}
          placeholder="Name this stage"
          aria-label="The stage's name"
          onChange={(event) => edit({ kind: "renameStage", stage: s, name: event.target.value })}
        />
      </div>
      {s === 0 ? (
        <p className="form-opens">Open from the start.</p>
      ) : (
        <DaysField
          days={stage.days}
          before={s}
          onChange={(days) => edit({ kind: "setStageDays", stage: s, days })}
        />
      )}
      {wrong.map((problem, i) => (
        <p key={i} className="form-problem">
          {problem.text}
        </p>
      ))}
      {steps > 0 && (
        <div>
          <h3 className="form-list-head" id={stepsHeading}>
            <span className="form-label">its steps · {steps}</span>
          </h3>
          <ol className="form-stage-steps" aria-labelledby={stepsHeading}>
            {stage.steps.map((step, i) => (
              <li key={`${i}:${step.id}`}>
                <button
                  type="button"
                  className="form-stage-step"
                  onClick={() => onSelect({ kind: "step", id: step.id })}
                >
                  <span className="anatomy-number">{i + 1}</span>
                  <span className="anatomy-text">
                    {excerptOf(step.prose) || <span className="form-missing">No prose yet</span>}
                  </span>
                  <span className="anatomy-part">{partWord(step)}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  )
}

/** How many days after the stage before is finished a stage opens, written into its sentence. The
 * box keeps what is typed; the draft changes only when it is a whole number of at least 1, and the
 * box shows the draft's number whenever it holds another whole number, as when the draft changes
 * elsewhere. */
function DaysField({
  days,
  before,
  onChange,
}: {
  days: number | null
  before: number
  onChange: (days: number) => void
}) {
  const id = useId()
  const [text, setText] = useState(days === null ? "" : String(days))
  // Half typed, or as the draft has it: the box as typed; a number the draft no longer has: the draft
  const typed = whole(text)
  const shown = typed === null || typed === days ? text : String(days ?? "")
  return (
    <p className="form-opens">
      <label htmlFor={id}>Opens</label>{" "}
      <input
        id={id}
        className="form-days"
        type="number"
        min={1}
        step={1}
        inputMode="numeric"
        value={shown}
        onChange={(event) => {
          setText(event.target.value)
          const next = whole(event.target.value)
          if (next !== null) onChange(next)
        }}
      />{" "}
      {days === 1 ? "day" : "days"} after stage {romanOf(before)} is finished.
    </p>
  )
}

/** A whole number of at least 1 typed in a box, or null. */
function whole(text: string): number | null {
  if (!/^\s*\d+\s*$/.test(text)) return null
  const n = Number(text)
  return n >= 1 ? n : null
}
