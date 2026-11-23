import type { Practice, StageId, StepId } from "./types"

/** Where a step is in a practice: its stage's place, and its place in that stage, from 0. */
export interface StepPlace {
  readonly stage: number
  readonly step: number
}

/** The place of the stage with this id, from 0: the first, should two have it; null when none
 * does. */
export function stageIndexOf(practice: Practice, id: StageId): number | null {
  const index = practice.stages.findIndex((stage) => stage.id === id)
  return index === -1 ? null : index
}

/** The place of the step with this id: the first, in the practice's order, should two have it; null
 * when none does. */
export function stepPlaceOf(practice: Practice, id: StepId): StepPlace | null {
  for (const [stage, { steps }] of practice.stages.entries()) {
    const step = steps.findIndex((each) => each.id === id)
    if (step !== -1) return { stage, step }
  }
  return null
}
