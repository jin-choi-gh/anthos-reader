import { advance, clockOffset, resetClock } from "../../runner/clock"
import type { Practice } from "../../practice/types"
import type { Run } from "../../runner/useRun"
import { clockText, DAY, eventsText, fullWhere, shortWhere } from "./summary"

/** Development only: where the run is, and two ways to move it that a reader never has. It acts on
 * the run and the clock directly, beside the frame and the scene, never through them: a new day or
 * an empty log gives a new position, and the rest follows from that. */
export function DevPanel({ practice, run }: { practice: Practice; run: Run }) {
  return (
    <details className="dev-panel">
      <summary>
        Dev · {shortWhere(practice, run.position)} · today {run.today}
      </summary>
      <dl>
        <dt>Practice</dt>
        <dd>
          {practice.title} ({practice.id})
        </dd>
        <dt>Where</dt>
        <dd>{fullWhere(practice, run.position)}</dd>
        <dt>Today</dt>
        <dd>{clockText(run.today, clockOffset())}</dd>
        <dt>Log</dt>
        <dd>{eventsText(run.log.length)}</dd>
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
      </div>
    </details>
  )
}
