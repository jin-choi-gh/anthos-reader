import type { Problem } from "../practice/problems"
import type { Practice } from "../practice/types"
import type { Selection } from "./selection"
import { excerptOf, isBroken, opensAfter, partWord, romanOf } from "./summary"

/** The reel's anatomy, as a book's contents. Each stage by its numeral and name, with when it opens
 * under it, and its steps by their number, the start of their prose, and at the right the part they
 * ask in a word or two; whatever is selected is set on a sunk ground, its number in red. Each stage
 * ends with the next step, not yet written, and the reel with the next stage, faint, like a line
 * waiting to be written; choosing one adds it. A stage or step with something written wrong has its
 * number, a mark after it, and its part in the colour of a problem; what is not yet written is shown
 * as missing. */
export function Anatomy({
  practice,
  problems,
  selection,
  onSelect,
  onAddStage,
  onAddStep,
}: {
  practice: Practice
  problems: readonly Problem[]
  selection: Selection | null
  onSelect: (selection: Selection) => void
  onAddStage: () => void
  onAddStep: (stage: number) => void
}) {
  const broken = (stage: number, step: number | null) =>
    problems.some((p) => p.stage === stage && p.step === step && isBroken(p))
  const isSelected = (kind: Selection["kind"], id: string) =>
    selection !== null && selection.kind === kind && selection.id === id

  return (
    <nav className="anatomy" aria-label="The reel">
      <ol className="anatomy-stages">
        {practice.stages.map((stage, s) => {
          const opens = s === 0 ? "open from the start" : opensAfter(practice, s)
          const wrong = broken(s, null)
          return (
            <li key={`${s}:${stage.id}`} className="anatomy-stage">
              <button
                type="button"
                className="anatomy-entry anatomy-stage-entry"
                aria-current={isSelected("stage", stage.id)}
                data-broken={wrong}
                onClick={() => onSelect({ kind: "stage", id: stage.id })}
              >
                <span className="anatomy-number">
                  {romanOf(s + 1)}
                  {wrong && <Mark />}
                </span>
                <span className="anatomy-text">
                  {stage.name.trim() === "" ? (
                    <span className="form-missing">Untitled stage</span>
                  ) : (
                    stage.name
                  )}
                </span>
                <span />
              </button>
              {opens !== null && (
                <p className="anatomy-opens">{s === 0 ? opens : `opens ${opens}`}</p>
              )}
              <ol className="anatomy-steps">
                {stage.steps.map((step, i) => {
                  const excerpt = excerptOf(step.prose)
                  const wrongStep = broken(s, i)
                  return (
                    <li key={`${i}:${step.id}`}>
                      <button
                        type="button"
                        className="anatomy-entry anatomy-step-entry"
                        aria-current={isSelected("step", step.id)}
                        data-broken={wrongStep}
                        onClick={() => onSelect({ kind: "step", id: step.id })}
                      >
                        <span className="anatomy-number">
                          {i + 1}
                          {wrongStep && <Mark />}
                        </span>
                        <span className="anatomy-text">
                          {excerpt === "" ? (
                            <span className="form-missing">No prose yet</span>
                          ) : (
                            excerpt
                          )}
                        </span>
                        <span className="anatomy-part">{partWord(step)}</span>
                      </button>
                    </li>
                  )
                })}
                <li>
                  <button
                    type="button"
                    className="anatomy-entry anatomy-step-entry anatomy-new"
                    aria-label={`Add a step to stage ${romanOf(s + 1)}`}
                    onClick={() => onAddStep(s)}
                  >
                    <span className="anatomy-number">{stage.steps.length + 1}</span>
                    <span className="anatomy-text">a new step</span>
                    <span />
                  </button>
                </li>
              </ol>
            </li>
          )
        })}
        <li className="anatomy-stage">
          <button
            type="button"
            className="anatomy-entry anatomy-stage-entry anatomy-new"
            aria-label="Add a stage"
            onClick={onAddStage}
          >
            <span className="anatomy-number">{romanOf(practice.stages.length + 1)}</span>
            <span className="anatomy-text">a new stage</span>
            <span />
          </button>
        </li>
      </ol>
    </nav>
  )
}

/** The mark after the number of a stage or step with something written wrong, said as words to
 * assistive technology. */
function Mark() {
  return (
    <span className="anatomy-mark">
      <span aria-hidden="true">!</span>
      <span className="form-said">, something to put right</span>
    </span>
  )
}
