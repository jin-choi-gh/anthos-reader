import type { Day } from "../clock/clock"
import type { Stage, Step } from "../practice/types"

/** What the runner logs: the reader came to a step, or reached a stage's rest. */
export type Event =
  | { readonly kind: "visited"; readonly stage: number; readonly step: number; readonly at: number }
  | { readonly kind: "finished"; readonly stage: number; readonly at: number; readonly day: Day }

/** Where the reader is. stage is stages.length in the final stage; step is
 * steps.length at a stage's rest. */
export interface Station {
  readonly stage: number
  readonly step: number
}

/** Where the run stands, from replaying the log: where the reader is, when the next stage
 * opens once this one is finished, and the step the reader may not pass until they have written. */
export interface Standing {
  readonly station: Station
  readonly opensOn: Day | null
  readonly heldAt: number | null
}

/** What the gate holds at a station: a step of the practice, as the practice writes it; the rest
 * at the end of a stage; or the final stage. */
export type Gate =
  | { readonly kind: "step"; readonly stage: Stage; readonly step: Step }
  | { readonly kind: "rest"; readonly stage: Stage }
  | { readonly kind: "final" }

/** Why the law refuses a move: there is no such step; the next stage is not open; a step on
 * the way asks for writing the reader has not done; or the practice is over. */
export type Reason =
  | { readonly kind: "noSuchStep" }
  | { readonly kind: "waiting"; readonly opensOn: Day | null }
  | { readonly kind: "unanswered" }
  | { readonly kind: "finished" }

export type Ruling =
  | { readonly allowed: true; readonly to: number }
  | { readonly allowed: false; readonly reason: Reason }
