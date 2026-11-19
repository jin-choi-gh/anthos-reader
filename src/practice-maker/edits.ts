import { assertNever } from "../assertNever"
import { REST } from "../practice/parts"
import type { EditorsNote, Practice, Recall, Stage, Step, Writing } from "../practice/types"

/** Where a step is in a draft: its stage's place, and its place in that stage, from 0. */
type StepPlace = { readonly stage: number; readonly step: number }

/** One change to a draft practice. Stages, steps and notes are named by their place, since steps
 * have no ids, and a draft's note ids may repeat until problemsOf says so. */
export type Edit =
  | { readonly kind: "retitle"; readonly title: string }
  | { readonly kind: "addStage"; readonly at: number; readonly name: string }
  | { readonly kind: "renameStage"; readonly stage: number; readonly name: string }
  | { readonly kind: "moveStage"; readonly from: number; readonly to: number }
  | { readonly kind: "removeStage"; readonly stage: number }
  | { readonly kind: "addStep"; readonly at: StepPlace }
  | { readonly kind: "moveStep"; readonly from: StepPlace; readonly to: StepPlace }
  | { readonly kind: "removeStep"; readonly at: StepPlace }
  | { readonly kind: "setProse"; readonly at: StepPlace; readonly prose: readonly string[] }
  | { readonly kind: "setWriting"; readonly at: StepPlace; readonly writing: Writing | null }
  | { readonly kind: "setRecall"; readonly at: StepPlace; readonly recall: Recall | null }
  | { readonly kind: "addNote"; readonly at: StepPlace; readonly note: EditorsNote }
  | {
      readonly kind: "changeNote"
      readonly at: StepPlace
      readonly index: number
      readonly note: EditorsNote
    }
  | {
      readonly kind: "moveNote"
      readonly at: StepPlace
      readonly from: number
      readonly to: number
    }
  | { readonly kind: "removeNote"; readonly at: StepPlace; readonly index: number }

/** The draft with one edit made. An edit naming a stage, step or note the draft does not have, or a
 * place it cannot go, changes nothing, and gives back the very same draft. A new stage has no steps,
 * and a new step no parts: problemsOf says so until they are written. Moving a thing to a place
 * counts that place as if it had been taken out first: moving the first of three steps to place 2
 * makes it the last. */
export function edited(draft: Practice, edit: Edit): Practice {
  switch (edit.kind) {
    case "retitle":
      return { ...draft, title: edit.title }
    case "addStage": {
      const stages = inserted(draft.stages, edit.at, { name: edit.name, steps: [] })
      return stages === null ? draft : { ...draft, stages }
    }
    case "renameStage":
      return withStage(draft, edit.stage, (stage) => ({ ...stage, name: edit.name }))
    case "moveStage": {
      const stages = moved(draft.stages, edit.from, edit.to)
      return stages === null ? draft : { ...draft, stages }
    }
    case "removeStage": {
      const stages = removed(draft.stages, edit.stage)
      return stages === null ? draft : { ...draft, stages }
    }
    case "addStep":
      return withStage(draft, edit.at.stage, (stage) => {
        const steps = inserted(stage.steps, edit.at.step, REST)
        return steps === null ? null : { ...stage, steps }
      })
    case "moveStep":
      return movedStep(draft, edit.from, edit.to)
    case "removeStep":
      return withStage(draft, edit.at.stage, (stage) => {
        const steps = removed(stage.steps, edit.at.step)
        return steps === null ? null : { ...stage, steps }
      })
    case "setProse":
      return withStep(draft, edit.at, (step) => ({ ...step, prose: edit.prose }))
    case "setWriting":
      return withStep(draft, edit.at, (step) => ({ ...step, writing: edit.writing }))
    case "setRecall":
      return withStep(draft, edit.at, (step) => ({ ...step, recall: edit.recall }))
    case "addNote":
      return withStep(draft, edit.at, (step) => ({
        ...step,
        highlight: [...step.highlight, edit.note],
      }))
    case "changeNote":
      return withStep(draft, edit.at, (step) => {
        if (step.highlight[edit.index] === undefined) return null
        const highlight = step.highlight.map((note, i) => (i === edit.index ? edit.note : note))
        return { ...step, highlight }
      })
    case "moveNote":
      return withStep(draft, edit.at, (step) => {
        const highlight = moved(step.highlight, edit.from, edit.to)
        return highlight === null ? null : { ...step, highlight }
      })
    case "removeNote":
      return withStep(draft, edit.at, (step) => {
        const highlight = removed(step.highlight, edit.index)
        return highlight === null ? null : { ...step, highlight }
      })
    default:
      return assertNever(edit)
  }
}

/** The id for a new editor's note: the first of note-1, note-2, … that no note of the draft has. */
export function nextNoteId(draft: Practice): string {
  const taken = new Set(
    draft.stages.flatMap((stage) => stage.steps.flatMap((step) => step.highlight.map((n) => n.id))),
  )
  let n = 1
  while (taken.has(`note-${n}`)) n++
  return `note-${n}`
}

/** A step moved from one place to another, in its stage or into another. Its new place is counted
 * in the target stage as it stands once the step is taken out of its own. */
function movedStep(draft: Practice, from: StepPlace, to: StepPlace): Practice {
  const step = draft.stages[from.stage]?.steps[from.step]
  const target = draft.stages[to.stage]
  if (step === undefined || target === undefined) return draft
  if (from.stage === to.stage) {
    return withStage(draft, from.stage, (stage) => {
      const steps = moved(stage.steps, from.step, to.step)
      return steps === null ? null : { ...stage, steps }
    })
  }
  const steps = inserted(target.steps, to.step, step)
  if (steps === null) return draft
  const stages = draft.stages.map((stage, s) =>
    s === from.stage
      ? { ...stage, steps: stage.steps.filter((_, i) => i !== from.step) }
      : s === to.stage
        ? { ...stage, steps }
        : stage,
  )
  return { ...draft, stages }
}

/** The draft with one stage changed; the very same draft when there is no such stage, or the
 * change gives null. */
function withStage(
  draft: Practice,
  index: number,
  change: (stage: Stage) => Stage | null,
): Practice {
  const stage = draft.stages[index]
  const changed = stage === undefined ? null : change(stage)
  if (changed === null) return draft
  return { ...draft, stages: draft.stages.map((s, i) => (i === index ? changed : s)) }
}

/** The draft with one step changed; the very same draft when there is no such step, or the change
 * gives null. */
function withStep(draft: Practice, at: StepPlace, change: (step: Step) => Step | null): Practice {
  return withStage(draft, at.stage, (stage) => {
    const step = stage.steps[at.step]
    const changed = step === undefined ? null : change(step)
    if (changed === null) return null
    return { ...stage, steps: stage.steps.map((s, i) => (i === at.step ? changed : s)) }
  })
}

/** A list with an item put at a place, from 0 to its length; null for any other place. */
function inserted<T>(list: readonly T[], at: number, item: T): T[] | null {
  if (!Number.isInteger(at) || at < 0 || at > list.length) return null
  return [...list.slice(0, at), item, ...list.slice(at)]
}

/** A list without the item at a place; null when it has none there. */
function removed<T>(list: readonly T[], at: number): T[] | null {
  if (list[at] === undefined || !Number.isInteger(at)) return null
  return list.filter((_, i) => i !== at)
}

/** A list with the item at one place moved to another, counted once it is taken out; null when
 * either place is not in the list, or they are the same, which moves nothing. */
function moved<T>(list: readonly T[], from: number, to: number): T[] | null {
  const item = list[from]
  if (from === to || item === undefined || list[to] === undefined) return null
  const rest = list.filter((_, i) => i !== from)
  return [...rest.slice(0, to), item, ...rest.slice(to)]
}
