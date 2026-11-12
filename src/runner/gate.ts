import type { Practice, Stage } from "../practice/types"
import type { Gate, Position } from "./types"

/** What is in the gate at a position: the practice's step there, or the rest, or the final stage.
 * The one place that reads the reel at a position: a position the practice does not have is a
 * mistake in the projector, never in the reel, so it throws. */
export function gateOf(practice: Practice, position: Position): Gate {
  if (position.stage === practice.stages.length) return { kind: "final" }
  const stage = stageAt(practice, position.stage)
  if (position.step === stage.steps.length) return { kind: "rest", stage }
  const step = stage.steps[position.step]
  if (step === undefined) {
    throw new RangeError(`${practice.id}: no step ${position.step} in stage ${position.stage}`)
  }
  return { kind: "step", stage, step }
}

/** Where a stage's rest is: one past its last step. */
export function restOf(practice: Practice, stage: number): number {
  return stageAt(practice, stage).steps.length
}

function stageAt(practice: Practice, index: number): Stage {
  const stage = practice.stages[index]
  if (stage === undefined) throw new RangeError(`${practice.id}: no stage ${index}`)
  return stage
}
