import type { Position, Ruling } from "../../practice/types"
import type { Subject } from "../scenes/types"

/** The frame, sitting on one step: where it is, the runner's rulings on a step back and a step on
 * (null where there is no runner, as in annotate mode), and the subject it hands the scene. */
export interface Frame {
  position: Position
  heading: string | null
  back: Ruling | null
  next: Ruling | null
  subject: Subject
}
