import type { Day } from "../../runner/types"
import type { Control, FrameControls } from "../frame/controls"
import type { PraxisBarProjection } from "../scenes/types"
import { reasonText } from "./reasonText"

/** The praxis bar, drawn from two sources that never meet: the frame's controls (its heading, and
 * Back and Next below) and the scene's projection (between them). Today is only for putting a
 * refusal into words: "tomorrow" depends on it. */
export function PraxisBar({
  controls,
  projection,
  today,
}: {
  controls: FrameControls
  projection: PraxisBarProjection | null
  today: Day
}) {
  const { heading, back, next } = controls
  // Only Next's refusals are worth saying
  const why = next.kind === "refused" ? reasonText(next.reason, today) : null
  const buttons = back.kind !== "none" || next.kind !== "none"

  return (
    <section className="praxis-bar" aria-label="Practice">
      {heading !== null && <h2 className="praxis-heading">{heading}</h2>}
      {projection !== null && <Projection projection={projection} />}
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

/** The scene's part of the praxis bar. */
function Projection({ projection }: { projection: PraxisBarProjection }) {
  switch (projection.kind) {
    case "prose":
      return (
        <div className="praxis-prose">
          {projection.paragraphs.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      )
  }
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
