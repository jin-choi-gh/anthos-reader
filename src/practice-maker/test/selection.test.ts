import { describe, expect, it } from "vitest"
import { REST } from "../../practice/parts"
import { practiceOf } from "../../practice/test/build"
import {
  firstSelection,
  firstUnfinished,
  isInDraft,
  placeAbove,
  placeBelow,
  selectionAfterRemoving,
} from "../selection"

const say = (words: string) => ({ ...REST, prose: [words] })

// stage-1: step-1, step-2; stage-2: (no steps); stage-3: step-3
const draft = practiceOf({
  id: "draft",
  title: "Draft",
  text: "dickinson",
  stages: [
    { name: "One", steps: [say("a"), say("b")] },
    { name: "Two", steps: [] },
    { name: "Three", steps: [say("c")] },
  ],
})

describe("firstSelection: what is selected when a draft opens", () => {
  it("is the first step, or else the first stage, or else nothing", () => {
    expect(firstSelection(draft)).toEqual({ kind: "step", id: "step-1" })
    const stepless = { ...draft, stages: [draft.stages[1]!] }
    expect(firstSelection(stepless)).toEqual({ kind: "stage", id: "stage-2" })
    expect(firstSelection({ ...draft, stages: [] })).toBeNull()
  })
})

describe("isInDraft", () => {
  it("says whether the draft has the stage or step selected", () => {
    expect(isInDraft(draft, { kind: "step", id: "step-3" })).toBe(true)
    expect(isInDraft(draft, { kind: "step", id: "stage-1" })).toBe(false)
    expect(isInDraft(draft, { kind: "stage", id: "stage-2" })).toBe(true)
  })
})

describe("selectionAfterRemoving: what is selected once the selection is removed", () => {
  it("is the next step in its stage, or else the one before, or else its stage", () => {
    expect(selectionAfterRemoving(draft, { kind: "step", id: "step-1" })).toEqual({
      kind: "step",
      id: "step-2",
    })
    expect(selectionAfterRemoving(draft, { kind: "step", id: "step-2" })).toEqual({
      kind: "step",
      id: "step-1",
    })
    expect(selectionAfterRemoving(draft, { kind: "step", id: "step-3" })).toEqual({
      kind: "stage",
      id: "stage-3",
    })
  })

  it("is the next stage, or else the one before, or else nothing", () => {
    expect(selectionAfterRemoving(draft, { kind: "stage", id: "stage-2" })).toEqual({
      kind: "stage",
      id: "stage-3",
    })
    expect(selectionAfterRemoving(draft, { kind: "stage", id: "stage-3" })).toEqual({
      kind: "stage",
      id: "stage-2",
    })
    const one = { ...draft, stages: [draft.stages[0]!] }
    expect(selectionAfterRemoving(one, { kind: "stage", id: "stage-1" })).toBeNull()
  })
})

describe("placeAbove and placeBelow: where a step moves", () => {
  it("move within a stage", () => {
    expect(placeAbove(draft, { stage: 0, step: 1 })).toEqual({ stage: 0, step: 0 })
    expect(placeBelow(draft, { stage: 0, step: 0 })).toEqual({ stage: 0, step: 1 })
  })

  it("cross into the stage before, at its end, or the stage after, at its start, empty or not", () => {
    expect(placeBelow(draft, { stage: 0, step: 1 })).toEqual({ stage: 1, step: 0 })
    expect(placeAbove(draft, { stage: 2, step: 0 })).toEqual({ stage: 1, step: 0 })
    const full = { ...draft, stages: [draft.stages[0]!, draft.stages[2]!] }
    expect(placeAbove(full, { stage: 1, step: 0 })).toEqual({ stage: 0, step: 2 })
  })

  it("go nowhere from the practice's first step up, or its last step down", () => {
    expect(placeAbove(draft, { stage: 0, step: 0 })).toBeNull()
    expect(placeBelow(draft, { stage: 2, step: 0 })).toBeNull()
  })
})

describe("firstUnfinished: where Save takes the editor", () => {
  const problem = (stage: number | null, step: number | null) =>
    ({ stage, step, note: null, about: "prose", text: "" }) as const

  it("is the stage or step of the first problem in one", () => {
    expect(firstUnfinished(draft, [problem(null, null), problem(0, 1), problem(1, null)])).toEqual({
      kind: "step",
      id: "step-2",
    })
    expect(firstUnfinished(draft, [problem(1, null)])).toEqual({ kind: "stage", id: "stage-2" })
  })

  it("is nothing when every problem is the practice's own", () => {
    expect(firstUnfinished(draft, [problem(null, null)])).toBeNull()
    expect(firstUnfinished(draft, [])).toBeNull()
  })
})
