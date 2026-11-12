// The run of a practice: what a reader did, as events in a log, and where that leaves them. The
// practice itself is read here, never changed.

import type { Stage, Step } from "../practice/types"

/** A local date, "2026-11-10"; days start at 04:00. */
export type Day = string

export type Event =
  | { kind: "visited"; stage: number; step: number; at: number }
  | { kind: "finished"; stage: number; at: number; day: Day }
  | { kind: "responded"; stage: number; step: number; text: string; at: number }

export interface Position {
  stage: number // stages.length: the final stage
  step: number // steps.length: the rest
  opensOn: Day | null
}

/** What the gate holds at a position: a step of the practice, as the practice writes it; the rest
 * at the end of a stage; or the final stage. Only the runner adds rests and the final stage, so only
 * the runner knows which positions are theirs. */
export type Gate =
  { kind: "step"; stage: Stage; step: Step } | { kind: "rest"; stage: Stage } | { kind: "final" }

export type Reason =
  { kind: "noSuchStep" } | { kind: "waiting"; opensOn: Day | null } | { kind: "finished" }

export type Ruling = { allowed: true; to: number } | { allowed: false; reason: Reason }
