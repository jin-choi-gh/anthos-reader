import { advance, clockOffset, resetClock } from "../../clock/clock"
import type { Practice } from "../../practice/types"
import type { Notebook } from "../../notebook/useNotebook"
import type { Run } from "../../runner/useRun"
import { clockText, DAY, eventsText, fullWhere, notesText, shortWhere } from "./summary"

/** Development only: where the run is, and two ways to move it that a reader never has. It acts on
 * the run and the clock directly, beside the frame and the scene, never through them: a new day or
 * an empty log gives a new position, and the rest follows from that. */
export function DevPanel({
  practice,
  run,
  notebook,
}: {
  practice: Practice
  run: Run
  notebook: Notebook
}) {
  return (
    <details className="dev-panel">
      <summary>
        Dev · {shortWhere(practice, run.standing.position)} · today {run.today}
      </summary>
      <dl>
        <dt>Practice</dt>
        <dd>
          {practice.title} ({practice.id})
        </dd>
        <dt>Where</dt>
        <dd>{fullWhere(practice, run.standing)}</dd>
        <dt>Today</dt>
        <dd>{clockText(run.today, clockOffset())}</dd>
        <dt>Log</dt>
        <dd>{eventsText(run.log.length)}</dd>
        <dt>Notebook</dt>
        <dd>{notesText(notebook.notes.length)}</dd>
      </dl>
      <div className="dev-actions">
        <button type="button" onClick={() => advance(DAY)}>
          +1 day
        </button>
        <button
          type="button"
          onClick={() => {
            // Together, or events stamped by the moved clock would lie in the future
            run.restart()
            resetClock()
          }}
        >
          Restart practice
        </button>
        <button type="button" onClick={() => notebook.clear()}>
          Clear notebook
        </button>
      </div>
    </details>
  )
}
