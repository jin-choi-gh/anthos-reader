import type { Parts, Practice, Stage, Step } from "../types"

/** A stage as a test writes it: its name and its steps' parts, and, only where the test is about
 * them, its id, its days and its steps' ids. */
export interface StageSketch {
  readonly name: string
  readonly steps: readonly (Parts & { readonly id?: string })[]
  readonly id?: string
  readonly days?: number | null
}

/** A practice as a test writes it: everything but its stages, which are sketched. */
export type PracticeSketch = Omit<Practice, "stages"> & { readonly stages: readonly StageSketch[] }

/** A practice for a test, with the ids and days the sketch leaves out filled in as Form Practice
 * gives them: stage-1, stage-2, …; step-1, step-2, …, counted through the practice; no days on the
 * first stage, and 1 on the others. */
export function practiceOf(sketch: PracticeSketch): Practice {
  let n = 0
  const stages = sketch.stages.map((stage, s): Stage => ({
    id: stage.id ?? `stage-${s + 1}`,
    name: stage.name,
    days: stage.days !== undefined ? stage.days : s === 0 ? null : 1,
    steps: stage.steps.map((step): Step => {
      n++
      return { ...step, id: step.id ?? `step-${n}` }
    }),
  }))
  return { ...sketch, stages }
}
