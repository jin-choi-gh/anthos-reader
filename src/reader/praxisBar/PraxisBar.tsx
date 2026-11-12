import type { Day } from "../../clock/clock"
import type { Control, FrameControls } from "../frame/controls"
import type { PraxisBarProjection, PraxisBarProtocol } from "../scenes/types"
import { NotebookPage } from "./NotebookPage"
import { reasonText } from "./reasonText"

/** The praxis bar: the frame's heading, Back and Next, and the scene's projection between them.
 * `today` is only for putting a refusal into words: "tomorrow" depends on it. */
export function PraxisBar({
  controls,
  projection,
  send,
  today,
}: {
  controls: FrameControls
  projection: PraxisBarProjection | null
  send: (message: PraxisBarProtocol["toScene"]) => void
  today: Day
}) {
  const { heading, back, next } = controls
  // Only Next's refusals are worth saying
  const why = next.kind === "refused" ? reasonText(next.reason, today) : null
  const buttons = back.kind !== "none" || next.kind !== "none"

  return (
    <section className="praxis-bar" aria-label="Practice">
      {heading !== null && <h2 className="praxis-heading">{heading}</h2>}
      {projection !== null && <Projection projection={projection} send={send} />}
      {buttons && (
        <nav className="praxis-controls" aria-label="Steps">
          <ControlButton control={back} label="Back" className="praxis-back" />
          {why !== null && <p className="praxis-why">{why}</p>}
          <ControlButton control={next} label="Next" className="praxis-next" />
        </nav>
      )}
    </section>
  )
}

/** The scene's part of the praxis bar: the intertitle, then the notebook page, if the frame has
 * either. */
function Projection({
  projection,
  send,
}: {
  projection: PraxisBarProjection
  send: (message: PraxisBarProtocol["toScene"]) => void
}) {
  return (
    <>
      {projection.prose.length > 0 && (
        <div className="praxis-prose">
          {projection.prose.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      )}
      {projection.writing !== null && <NotebookPage page={projection.writing} send={send} />}
    </>
  )
}

/** One of the frame's buttons: pressed, it moves the frame; refused, it is there but disabled; none,
 * it is not there at all. */
function ControlButton({
  control,
  label,
  className,
}: {
  control: Control
  label: string
  className: string
}) {
  switch (control.kind) {
    case "go":
      return (
        <button type="button" className={`praxis-button ${className}`} onClick={control.go}>
          {label}
        </button>
      )
    case "refused":
      return (
        <button type="button" className={`praxis-button ${className}`} disabled>
          {label}
        </button>
      )
    case "none":
      return null
  }
}
