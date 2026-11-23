import { stageIndexOf, stepPlaceOf, type StepPlace } from "../practice/places"
import type { Problem } from "../practice/problems"
import type { Practice, StageId, StepId } from "../practice/types"

/** What is selected in the reel's anatomy: a stage or a step, by its id, so that it stays selected
 * as it moves. */
export type Selection =
  { readonly kind: "stage"; readonly id: StageId } | { readonly kind: "step"; readonly id: StepId }

/** What to select when a draft opens: its first step, or, with no steps, its first stage, or
 * nothing. */
export function firstSelection(draft: Practice): Selection | null {
  const step = draft.stages.flatMap((stage) => stage.steps)[0]
  if (step !== undefined) return { kind: "step", id: step.id }
  const stage = draft.stages[0]
  return stage === undefined ? null : { kind: "stage", id: stage.id }
}

/** Whether a selection names a stage or step the draft has. */
export function isInDraft(draft: Practice, selection: Selection): boolean {
  return selection.kind === "stage"
    ? stageIndexOf(draft, selection.id) !== null
    : stepPlaceOf(draft, selection.id) !== null
}

/** What to select once the selected stage or step is removed from the draft as it is now: the step
 * after it in its stage, or else the one before, or else its stage; for a stage, the stage after
 * it, or else the one before, or else nothing. */
export function selectionAfterRemoving(draft: Practice, selection: Selection): Selection | null {
  if (selection.kind === "step") {
    const place = stepPlaceOf(draft, selection.id)
    if (place === null) return null
    const stage = draft.stages[place.stage]!
    const near = stage.steps[place.step + 1] ?? stage.steps[place.step - 1]
    return near === undefined ? { kind: "stage", id: stage.id } : { kind: "step", id: near.id }
  }
  const index = stageIndexOf(draft, selection.id)
  if (index === null) return null
  const near = draft.stages[index + 1] ?? draft.stages[index - 1]
  return near === undefined ? null : { kind: "stage", id: near.id }
}

/** Where a step goes when moved up: before the step above it in its stage, or, first in its
 * stage, to the end of the stage before; null when it is the practice's first step. */
export function placeAbove(draft: Practice, at: StepPlace): StepPlace | null {
  if (at.step > 0) return { stage: at.stage, step: at.step - 1 }
  const before = draft.stages[at.stage - 1]
  return before === undefined ? null : { stage: at.stage - 1, step: before.steps.length }
}

/** Where a step goes when moved down: after the step below it in its stage, or, last in its
 * stage, to the start of the stage after; null when it is the practice's last step. */
export function placeBelow(draft: Practice, at: StepPlace): StepPlace | null {
  const stage = draft.stages[at.stage]
  if (stage === undefined) return null
  if (at.step < stage.steps.length - 1) return { stage: at.stage, step: at.step + 1 }
  return at.stage < draft.stages.length - 1 ? { stage: at.stage + 1, step: 0 } : null
}

/** Where Save takes the editor when the draft has problems: the stage or step of the first problem
 * that is in one, or null when every problem is the practice's own (no title, no stages). */
export function firstUnfinished(draft: Practice, problems: readonly Problem[]): Selection | null {
  for (const problem of problems) {
    if (problem.stage === null) continue
    const stage = draft.stages[problem.stage]
    if (stage === undefined) continue
    const step = problem.step === null ? undefined : stage.steps[problem.step]
    return step === undefined ? { kind: "stage", id: stage.id } : { kind: "step", id: step.id }
  }
  return null
}
