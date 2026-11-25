import { assertNever } from "../../assertNever"
import type { Day } from "../../clock/clock"
import { Button } from "../../components/controls"
import type { Control, FrameControls } from "../frame/controls"
import type { Asks, PraxisBarProjection, PraxisBarProtocol } from "../scenes/types"
import { NotebookPage } from "./NotebookPage"
import { NotingPage } from "./NotingPage"
import { reasonText } from "./reasonText"
import "./praxisBar.css"

/** What a step asks of the reader, in the words the praxis bar names it by, after a pilcrow. */
const ASKED: Record<Exclude<Asks, null>, string> = {
  read: "read",
  notes: "notes",
  write: "write",
  recall: "look back",
}

/** The praxis bar: the frame's heading, the step's position in its stage, Back and Next, and the
 * scene's projection between them. On a step of a stage it also names what the step asks; at a
 * rest, which has nothing to say, it sets a dinkus; in the final stage, with no buttons, it is a
 * colophon. `today` is only for putting a refusal into words: "tomorrow" depends on it. `label`
 * names the bar to assistive technology: what the reader is doing in it. */
export function PraxisBar({
  controls,
  projection,
  send,
  today,
  label,
}: {
  controls: FrameControls
  projection: PraxisBarProjection | null
  send: (message: PraxisBarProtocol["toScene"]) => void
  today: Day
  label: string
}) {
  const { heading, position, back, next } = controls
  // Only Next's refusals are worth saying
  const why = next.kind === "refused" ? reasonText(next.reason, today) : null
  const buttons = back.kind !== "none" || next.kind !== "none"
  const asks = position === null ? null : (projection?.asks ?? null)
  const rest = heading !== null && position === null && projection === null && buttons
  const colophon = heading !== null && position === null && !buttons && projection !== null

  return (
    <section className="praxis-bar" aria-label={label} data-colophon={colophon}>
      {heading !== null && (
        <div className="praxis-head">
          <h2 className="praxis-heading">{heading}</h2>
          {position !== null && (
            <span className="praxis-position">
              step {position.step} of {position.of}
            </span>
          )}
        </div>
      )}
      {position !== null && (
        <div className="praxis-steps" aria-hidden="true">
          {Array.from({ length: position.of }, (_, i) => (
            <i
              key={i}
              data-at={i + 1 < position.step ? "done" : i + 1 === position.step ? "here" : "ahead"}
            />
          ))}
        </div>
      )}
      {asks !== null && (
        <p className="praxis-asks">
          <span aria-hidden="true">¶ </span>
          {ASKED[asks]}
        </p>
      )}
      {rest && (
        <p className="praxis-dinkus" aria-hidden="true">
          ***
        </p>
      )}
      {projection !== null && <Projection projection={projection} send={send} />}
      {buttons && (
        <nav className="praxis-controls" aria-label="Steps">
          <ControlButton control={back} label="Back" className="praxis-back" way="back" />
          {why !== null && <p className="praxis-why">{why}</p>}
          <ControlButton
            control={next}
            label="Next"
            className="praxis-next button--primary"
            way="on"
          />
        </nav>
      )}
    </section>
  )
}

/** The scene's part of the praxis bar: the prose, then the writing or the noting, whichever the
 * frame has. */
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
      {projection.noting !== null && <NotingPage page={projection.noting} send={send} />}
    </>
  )
}

/** One of the frame's buttons: pressed, it moves the frame; refused, it is there but disabled; none,
 * it is not there at all. Its arrow, pointing the way it goes, is drawn but not read out. */
function ControlButton({
  control,
  label,
  className,
  way,
}: {
  control: Control
  label: string
  className: string
  way: "back" | "on"
}) {
  const words = (
    <>
      {way === "back" && <span aria-hidden="true">‹ </span>}
      {label}
      {way === "on" && <span aria-hidden="true"> ›</span>}
    </>
  )
  switch (control.kind) {
    case "go":
      return (
        <Button className={className} onClick={control.go}>
          {words}
        </Button>
      )
    case "refused":
      return (
        <Button className={className} disabled>
          {words}
        </Button>
      )
    case "none":
      return null
    default:
      return assertNever(control)
  }
}
