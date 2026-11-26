import type { Ruling } from "../../runner/types"
import type { Subject } from "../scenes/types"

/** Where a step is in its stage: its number, from 1, and how many steps the stage has. */
export interface Position {
  step: number
  of: number
}

/** The frame, sitting on one step: its heading, the step's position in its stage (null at a rest,
 * in the final stage and in annotate mode), the runner's rulings on a step back and a step on (null
 * where there is no runner, as in annotate mode), and the subject it hands the scene. */
export interface Frame {
  heading: string | null
  position: Position | null
  back: Ruling | null
  next: Ruling | null
  subject: Subject
}
