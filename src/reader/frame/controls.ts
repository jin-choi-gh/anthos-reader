import { nextDay } from "../../practice/step"
import type { Day, Reason, Ruling } from "../../practice/types"
import type { Frame } from "./types"

/** One of the frame's two buttons, as the praxis bar shows it: one that moves the frame, one the
 * runner refuses (with its reason in words, when there is one worth saying), or none at all. */
export type Control =
  { kind: "go"; go: () => void } | { kind: "refused"; why: string | null } | { kind: "none" }

/** The frame as the praxis bar shows it: its heading, and its buttons back and on. */
export interface FrameControls {
  heading: string | null
  back: Control
  next: Control
}

/** The frame's controls: its rulings made into buttons. Pressing one that goes moves the run to the
 * step the runner allowed; the praxis bar never learns which step that is. */
export function controlsOf(
  frame: Frame,
  moveTo: (step: number) => void,
  today: Day,
): FrameControls {
  return {
    heading: frame.heading,
    back: controlOf(frame.back, moveTo, today),
    next: controlOf(frame.next, moveTo, today),
  }
}

function controlOf(decision: Ruling | null, moveTo: (step: number) => void, today: Day): Control {
  if (decision === null) return { kind: "none" } // no runner, as in annotate mode
  if (decision.allowed) {
    const { to } = decision
    return { kind: "go", go: () => moveTo(to) }
  }
  // In the final stage there is nowhere left to go: no buttons at all
  if (decision.reason.kind === "finished") return { kind: "none" }
  return { kind: "refused", why: reasonText(decision.reason, today) }
}

/** A refusal in words, for the reader, or null when the disabled button says enough by itself. */
export function reasonText(reason: Reason, today: Day): string | null {
  switch (reason.kind) {
    case "noSuchStep":
      return null // as Back on a stage's first step
    case "waiting":
      if (reason.opensOn === null) return "The next stage isn't open yet."
      if (reason.opensOn === nextDay(today)) return "The next stage opens tomorrow."
      return `The next stage opens on ${dayAndMonth(reason.opensOn)}.`
    case "finished":
      return null
  }
}

/** A day as "14 November". The day is a date, not an instant, so it is read and written in UTC,
 * where it cannot slip into the day before or after. */
function dayAndMonth(day: Day): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${day}T00:00:00Z`))
}
