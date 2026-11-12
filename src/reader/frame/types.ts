import type { Ruling } from "../../runner/types"
import type { Subject } from "../scenes/types"

/** The frame, sitting on one step: its heading, the runner's rulings on a step back and a step on
 * (null where there is no runner, as in annotate mode), and the subject it hands the scene. The
 * position it sits at stays with the run: nothing past the frame needs it. */
export interface Frame {
  heading: string | null
  back: Ruling | null
  next: Ruling | null
  subject: Subject
}
