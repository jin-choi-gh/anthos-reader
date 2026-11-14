import { advance, clockOffset, resetClock } from "../../clock/clock"
import { clearNotebook } from "../../notebook/log"
import type { ReaderNote } from "../../notebook/types"
import type { Practice } from "../../practice/types"
import { clearLog } from "../../runner/log"
import type { Run } from "../../runner/useRun"
import { clockText, DAY, eventsText, fullWhere, notesText, shortWhere } from "./summary"

/** Development only: where the run is, and three things a reader can never do. It works the clock,
 * the run's log and the notebook directly, beside the frame and the scene, never through them: a new
 * day, an empty log or an empty notebook gives a new standing, and the rest follows from that. */
export function DevPanel({
  practice,
  run,
  notes,
}: {
  practice: Practice
  run: Run
  notes: readonly ReaderNote[]
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
        <dd>{notesText(notes.length)}</dd>
      </dl>
      <div className="dev-actions">
        <button type="button" onClick={() => advance(DAY)}>
          +1 day
        </button>
        <button
          type="button"
          onClick={() => {
            // Together, or events stamped by the moved clock would lie in the future
            clearLog(practice)
            resetClock()
          }}
        >
          Restart practice
        </button>
        <button type="button" onClick={() => clearNotebook(practice.text)}>
          Clear notebook
        </button>
      </div>
    </details>
  )
}
