import type { Reason, Ruling } from "../../runner/types"
import type { Frame } from "./types"

/** One of the frame's two buttons, as the praxis bar shows it: one that moves the frame, one the
 * runner refuses (with the runner's reason, for the praxis bar to put into words), or none at all. */
export type Control =
  { kind: "go"; go: () => void } | { kind: "refused"; reason: Reason } | { kind: "none" }

/** The frame as the praxis bar shows it: its heading, and its buttons back and on. */
export interface FrameControls {
  heading: string | null
  back: Control
  next: Control
}

/** The frame's controls: its rulings made into buttons. Pressing one that goes moves the run to the
 * step the runner allowed; the praxis bar never learns which step that is. */
export function controlsOf(frame: Frame, moveTo: (step: number) => void): FrameControls {
  return {
    heading: frame.heading,
    back: controlOf(frame.back, moveTo),
    next: controlOf(frame.next, moveTo),
  }
}

function controlOf(decision: Ruling | null, moveTo: (step: number) => void): Control {
  if (decision === null) return { kind: "none" } // no runner, as in annotate mode
  if (decision.allowed) {
    const { to } = decision
    return { kind: "go", go: () => moveTo(to) }
  }
  // In the final stage there is nowhere left to go: no buttons at all
  if (decision.reason.kind === "finished") return { kind: "none" }
  // A step that asks for writing: Next is not there at all until the reader has written
  if (decision.reason.kind === "unanswered") return { kind: "none" }
  return { kind: "refused", reason: decision.reason }
}
