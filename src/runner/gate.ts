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

/** How many days after a stage is finished the next one opens: the next stage's days, or none
 * before the final stage, which opens at once. A practice that runs gives every later stage its
 * days; one that does not is taken to wait a day. */
export function daysUntilNext(practice: Practice, stage: number): number {
  stageAt(practice, stage)
  if (stage === finalOf(practice) - 1) return 0
  return stageAt(practice, stage + 1).days ?? 1
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
