import type { Practice, Stage } from "../practice/types"
import type { Gate, Station } from "./types"

/** What is at a station: the practice's step there, or the rest, or the final stage. A station
 * the practice does not have is a mistake in the runner, never in the practice, so it throws. */
export function gateOf(practice: Practice, station: Station): Gate {
  if (station.stage === finalOf(practice)) return { kind: "final" }
  const stage = stageAt(practice, station.stage)
  if (station.step === stage.steps.length) return { kind: "rest", stage }
  const step = stage.steps[station.step]
  if (step === undefined) {
    throw new RangeError(`${practice.id}: no step ${station.step} in stage ${station.stage}`)
  }
  return { kind: "step", stage, step }
}

/** Where a stage's rest is: one past its last step. */
export function restOf(practice: Practice, stage: number): number {
  return stageAt(practice, stage).steps.length
}

/** Where the final stage is: one past the last stage. */
export function finalOf(practice: Practice): number {
  return practice.stages.length
}

function stageAt(practice: Practice, index: number): Stage {
  const stage = practice.stages[index]
  if (stage === undefined) throw new RangeError(`${practice.id}: no stage ${index}`)
  return stage
}
