import { assertNever } from "../../assertNever"
import type { Day } from "../../clock/clock"
import { Button } from "../../components/controls"
import type { PageOrSpread } from "../../components/usePlatform"
import type { Control, FrameControls } from "../frame/controls"
import type { Asks, PraxisBarProjection, PraxisBarProtocol } from "../scenes/types"
import { DisclosedNotes } from "./DisclosedNotes"
import { NotebookPage } from "./NotebookPage"
import { NotingPage } from "./NotingPage"
import { reasonText } from "./reasonText"
import { SlipTray } from "./SlipTray"
import { useDisclosing, type Disclosing } from "./useDisclosing"
import "./praxisBar.css"

/** What a step asks of the reader, in the words the praxis bar names it by, after a pilcrow. */
const ASKED: Record<Exclude<Asks, null>, string> = {
  read: "read",
  disclose: "disclose",
  write: "write",
  recall: "look back",
  restore: "restore",
}

/** The praxis bar: the frame's heading, the step's position in its stage, Back and Next, and the
 * scene's projection between them. On a step of a stage it also names what the step asks; at a
 * rest, which has nothing to say, it sets a dinkus, and Next, refused, is left out for the words of
 * its refusal; in the final stage, with nowhere further to go and only Back, it is a colophon. When
 * Next finishes the stage, it says that it completes it; on a stage finished already, it is Next.
 * While notes are still to be disclosed, or one is typing, Disclose stands where Next does, the same
 * button, so that the keyboard's focus stays on it when it becomes Next.
 * `today` is only for putting a refusal into words: "tomorrow" depends on it. `label` names the bar
 * to assistive technology: what the reader is doing in it. `layout` says how notes disclosed are
 * drawn: all of them in the margin of a spread, or one at a time on a page. */
export function PraxisBar({
  controls,
  projection,
  send,
  today,
  label,
  layout = "spread",
}: {
  controls: FrameControls
  projection: PraxisBarProjection | null
  send: (message: PraxisBarProtocol["toScene"]) => void
  today: Day
  label: string
  layout?: PageOrSpread
}) {
  const { heading, position, back, next } = controls
  const disclosure = projection?.disclosure ?? null
  const disclosing = useDisclosing(disclosure, send)
  const discloses = disclosure !== null && (disclosure.more || disclosing.typing !== null)
  // Only Next's refusals are worth saying
  const why = next.kind === "refused" ? reasonText(next.reason, today) : null
  const buttons = back.kind !== "none" || next.kind !== "none" || discloses
  const asks = position === null ? null : (projection?.asks ?? null)
  const rest = heading !== null && position === null && projection === null && buttons
  // The final stage: something to say, with no step and nowhere further to go
  const colophon =
    heading !== null && position === null && projection !== null && next.kind === "none"
  // At a rest, a refused Next is not drawn: the refusal's words say what waits
  const shownNext: Control = rest && next.kind === "refused" ? { kind: "none" } : next

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
      {projection !== null && (
        <Projection projection={projection} send={send} disclosing={disclosing} layout={layout} />
      )}
      {buttons && (
        <nav className="praxis-controls" aria-label="Steps">
          <ControlButton control={back} label="Back" className="praxis-back" way="back" />
          {why !== null && <p className="praxis-why">{why}</p>}
          <NextButton
            control={shownNext}
            label={next.kind === "go" && next.finishes ? "Complete Stage" : "Next"}
            disclosing={disclosure === null ? null : disclosing}
            discloses={discloses}
          />
        </nav>
      )}
    </section>
  )
}

/** The scene's part of the praxis bar: the prose, then the writing, the noting, the notes disclosed
 * or the slips, whichever the frame has. */
function Projection({
  projection,
  send,
  disclosing,
  layout,
}: {
  projection: PraxisBarProjection
  send: (message: PraxisBarProtocol["toScene"]) => void
  disclosing: Disclosing
  layout: PageOrSpread
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
      {projection.disclosure !== null && (
        <DisclosedNotes
          disclosure={projection.disclosure}
          disclosing={disclosing}
          layout={layout}
        />
      )}
      {projection.restore !== null && <SlipTray tray={projection.restore} send={send} />}
    </>
  )
}

/** The button where Next is: Disclose, while notes are still to be disclosed or one is typing, which
 * then shows it whole; otherwise the frame's Next, which, just after a note is shown whole, waits
 * (Disclosing's guard). Either way the same button, so that the focus stays on it. */
function NextButton({
  control,
  label,
  disclosing,
  discloses,
}: {
  control: Control
  label: string
  disclosing: Disclosing | null
  discloses: boolean
}) {
  const className = "praxis-next button--primary"
  if (discloses && disclosing !== null) {
    return (
      <Button className={className} onClick={() => disclosing.disclose()}>
        Disclose
      </Button>
    )
  }
  const words = (
    <>
      {label}
      <span aria-hidden="true"> ›</span>
    </>
  )
  switch (control.kind) {
    case "go":
      return (
        <Button
          className={className}
          onClick={() => {
            if (disclosing?.holding() !== true) control.go()
          }}
        >
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
