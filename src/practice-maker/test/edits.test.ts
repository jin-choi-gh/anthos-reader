import { describe, expect, it } from "vitest"
import { REST } from "../../practice/parts"
import { practiceOf } from "../../practice/test/build"
import type { EditorsNote, Parts, Practice } from "../../practice/types"
import { edited, nextNoteId, nextStageId, nextStepId, type Edit } from "../edits"

const note = (id: string): EditorsNote => ({ id, notehead: "l1", tags: [], body: id })
const say = (words: string, ...notes: EditorsNote[]): Parts => ({
  ...REST,
  prose: [words],
  disclose: notes,
})

const draft: Practice = practiceOf({
  id: "draft",
  title: "Draft",
  text: "dickinson",
  stages: [
    { name: "One", steps: [say("a", note("n1"), note("n2")), say("b")] },
    { name: "Two", steps: [say("c")], days: 2 },
  ],
})

/** The words of each stage's steps, to see where steps went. */
const words = (practice: Practice) =>
  practice.stages.map((stage) => stage.steps.map((step) => step.prose.join(" ")))

/** Each stage's name and days. */
const days = (practice: Practice) => practice.stages.map((stage) => [stage.name, stage.days])

describe("edited: one change to a draft", () => {
  it("retitles the practice", () => {
    expect(edited(draft, { kind: "retitle", title: "Renamed" }).title).toBe("Renamed")
  })

  it("adds a stage, with its id and no steps, at any place from first to last", () => {
    const added = edited(draft, { kind: "addStage", at: 1, id: "stage-3", name: "Between" })
    expect(added.stages.map((stage) => stage.name)).toEqual(["One", "Between", "Two"])
    expect(added.stages[1]).toEqual({ id: "stage-3", name: "Between", days: 1, steps: [] })
    const last = edited(draft, { kind: "addStage", at: 2, id: "stage-3", name: "Last" })
    expect(last.stages.map((stage) => stage.name)).toEqual(["One", "Two", "Last"])
  })

  it("gives a stage added first no days, and the stage that was first a day's wait", () => {
    const added = edited(draft, { kind: "addStage", at: 0, id: "stage-3", name: "Before" })
    expect(days(added)).toEqual([
      ["Before", null],
      ["One", 1],
      ["Two", 2],
    ])
  })

  it("renames, moves and removes a stage", () => {
    expect(edited(draft, { kind: "renameStage", stage: 1, name: "Second" }).stages[1]!.name).toBe(
      "Second",
    )
    expect(words(edited(draft, { kind: "moveStage", from: 0, to: 1 }))).toEqual([["c"], ["a", "b"]])
    expect(words(edited(draft, { kind: "removeStage", stage: 0 }))).toEqual([["c"]])
  })

  it("keeps the first stage without days, and later ones with some, as stages move and go", () => {
    expect(days(edited(draft, { kind: "moveStage", from: 0, to: 1 }))).toEqual([
      ["Two", null],
      ["One", 1],
    ])
    expect(days(edited(draft, { kind: "removeStage", stage: 0 }))).toEqual([["Two", null]])
  })

  it("sets a later stage's days to a whole number of at least 1", () => {
    expect(days(edited(draft, { kind: "setStageDays", stage: 1, days: 7 }))).toEqual([
      ["One", null],
      ["Two", 7],
    ])
  })

  it("adds a step, with its id and no parts", () => {
    const added = edited(draft, { kind: "addStep", at: { stage: 1, step: 0 }, id: "step-4" })
    expect(added.stages[1]!.steps).toEqual([{ id: "step-4", ...REST }, draft.stages[1]!.steps[0]])
  })

  it("moves a step in its stage, counting its new place once it is taken out", () => {
    const moved = edited(draft, {
      kind: "moveStep",
      from: { stage: 0, step: 0 },
      to: { stage: 0, step: 1 },
    })
    expect(words(moved)).toEqual([["b", "a"], ["c"]])
  })

  it("moves a step into another stage, at any place from first to last, keeping its id", () => {
    const first = edited(draft, {
      kind: "moveStep",
      from: { stage: 0, step: 1 },
      to: { stage: 1, step: 0 },
    })
    expect(words(first)).toEqual([["a"], ["b", "c"]])
    expect(first.stages[1]!.steps[0]!.id).toBe("step-2")
    const last = edited(draft, {
      kind: "moveStep",
      from: { stage: 0, step: 1 },
      to: { stage: 1, step: 1 },
    })
    expect(words(last)).toEqual([["a"], ["c", "b"]])
  })

  it("removes a step, even one a recall names, which then names nothing", () => {
    const recalled = edited(draft, {
      kind: "setParts",
      at: { stage: 1, step: 0 },
      disclose: [],
      writing: null,
      recall: { from: "step", id: "step-1" },
      restore: null,
    })
    const removed = edited(recalled, { kind: "removeStep", at: { stage: 0, step: 0 } })
    expect(words(removed)).toEqual([["b"], ["c"]])
    expect(removed.stages[1]!.steps[0]!.recall).toEqual({ from: "step", id: "step-1" })
  })

  it("sets a step's prose, and its other parts together, so that one edit leaves it one", () => {
    const at = { stage: 0, step: 0 }
    const writing = { target: "chosen", tags: ["gloss"], count: "one" } as const
    let changed = edited(draft, { kind: "setProse", at, prose: ["Look.", "Again."] })
    changed = edited(changed, {
      kind: "setParts",
      at,
      disclose: [],
      writing,
      recall: null,
      restore: null,
    })
    expect(changed.stages[0]!.steps[0]).toEqual({
      id: "step-1",
      prose: ["Look.", "Again."],
      disclose: [],
      writing,
      recall: null,
      restore: null,
    })
  })

  it("sets a restore as one of the parts, so that setting another takes the restore away", () => {
    const at = { stage: 0, step: 0 }
    const restore = { of: "words", gaps: ["l1 Bird", "l1 Walk"] } as const
    const parts = { kind: "setParts", at, disclose: [], writing: null, recall: null } as const
    const restoring = edited(draft, { ...parts, restore })
    expect(restoring.stages[0]!.steps[0]!.restore).toEqual(restore)
    const writing = { target: "whole", tags: [], count: "one" } as const
    const asking = edited(restoring, { ...parts, writing, restore: null })
    expect(asking.stages[0]!.steps[0]).toMatchObject({ writing, restore: null })
  })

  it("adds, changes, moves and removes a step's editor's notes", () => {
    const at = { stage: 0, step: 0 }
    const ids = (practice: Practice) => practice.stages[0]!.steps[0]!.disclose.map((n) => n.id)
    expect(ids(edited(draft, { kind: "addNote", at, note: note("n3") }))).toEqual([
      "n1",
      "n2",
      "n3",
    ])
    const changed = edited(draft, { kind: "changeNote", at, index: 1, note: note("worm") })
    expect(ids(changed)).toEqual(["n1", "worm"])
    expect(ids(edited(draft, { kind: "moveNote", at, from: 1, to: 0 }))).toEqual(["n2", "n1"])
    expect(ids(edited(draft, { kind: "removeNote", at, index: 0 }))).toEqual(["n2"])
  })

  it("changes nothing, giving back the very same draft, for a place the draft does not have", () => {
    const none = { disclose: [], writing: null, recall: null, restore: null }
    const nowhere: Edit[] = [
      { kind: "addStage", at: 3, id: "stage-3", name: "Far" },
      { kind: "addStage", at: -1, id: "stage-3", name: "Before" },
      { kind: "renameStage", stage: 2, name: "None" },
      { kind: "setStageDays", stage: 2, days: 1 },
      { kind: "moveStage", from: 0, to: 2 },
      { kind: "moveStage", from: 1, to: 1 },
      { kind: "removeStage", stage: 5 },
      { kind: "addStep", at: { stage: 1, step: 2 }, id: "step-4" },
      { kind: "addStep", at: { stage: 2, step: 0 }, id: "step-4" },
      { kind: "moveStep", from: { stage: 0, step: 2 }, to: { stage: 1, step: 0 } },
      { kind: "moveStep", from: { stage: 0, step: 0 }, to: { stage: 1, step: 2 } },
      { kind: "moveStep", from: { stage: 0, step: 0 }, to: { stage: 0, step: 2 } },
      { kind: "moveStep", from: { stage: 0, step: 0 }, to: { stage: 0, step: 0 } },
      { kind: "removeStep", at: { stage: 1, step: 1 } },
      { kind: "setProse", at: { stage: 0, step: 9 }, prose: [] },
      { kind: "setParts", at: { stage: 3, step: 0 }, ...none },
      { kind: "setParts", at: { stage: 0, step: -1 }, ...none },
      { kind: "addNote", at: { stage: 2, step: 0 }, note: note("x") },
      { kind: "changeNote", at: { stage: 0, step: 0 }, index: 2, note: note("x") },
      { kind: "moveNote", at: { stage: 0, step: 0 }, from: 0, to: 2 },
      { kind: "removeNote", at: { stage: 0, step: 1 }, index: 0 },
    ]
    for (const edit of nowhere) expect(edited(draft, edit), JSON.stringify(edit)).toBe(draft)
  })

  it("changes nothing for days on the first stage, or days that are not a whole number of at least 1", () => {
    for (const [stage, value] of [
      [0, 2],
      [1, 0],
      [1, -1],
      [1, 1.5],
      [1, Number.NaN],
    ] as const) {
      expect(edited(draft, { kind: "setStageDays", stage, days: value })).toBe(draft)
    }
  })

  it("leaves the draft it was given as it was", () => {
    const before = JSON.stringify(draft)
    edited(draft, { kind: "removeStage", stage: 0 })
    edited(draft, { kind: "moveStage", from: 0, to: 1 })
    edited(draft, { kind: "addNote", at: { stage: 0, step: 0 }, note: note("n9") })
    expect(JSON.stringify(draft)).toBe(before)
  })
})

describe("nextNoteId: the id for a new editor's note", () => {
  it("is the first of note-1, note-2, … that no note of the draft has", () => {
    expect(nextNoteId({ ...draft, stages: [] })).toBe("note-1")
    const used = practiceOf({
      ...draft,
      stages: [
        {
          name: "One",
          steps: [say("a", note("note-1"), note("note-3")), say("b", note("note-2"))],
        },
      ],
    })
    expect(nextNoteId(used)).toBe("note-4")
    expect(
      nextNoteId(
        practiceOf({ ...draft, stages: [{ name: "One", steps: [say("a", note("note-2"))] }] }),
      ),
    ).toBe("note-1")
  })
})

describe("nextStageId and nextStepId: the ids for a new stage and a new step", () => {
  it("are the first of stage-1, … and of step-1, … that the draft does not use", () => {
    expect(nextStageId(draft)).toBe("stage-3")
    expect(nextStepId(draft)).toBe("step-4")
    const gap = edited(draft, { kind: "removeStep", at: { stage: 0, step: 0 } })
    expect(nextStepId(gap)).toBe("step-1")
    expect(nextStageId({ ...draft, stages: [] })).toBe("stage-1")
  })

  it("pass over an id a recall still names, so that it never comes to name another", () => {
    const recalling = (recall: Parts["recall"]): Practice =>
      edited(draft, {
        kind: "setParts",
        at: { stage: 1, step: 0 },
        disclose: [],
        writing: null,
        recall,
        restore: null,
      })
    const step = edited(recalling({ from: "step", id: "step-1" }), {
      kind: "removeStep",
      at: { stage: 0, step: 0 },
    })
    expect(nextStepId(step)).toBe("step-4")
    const stage = recalling({ from: "stage", id: "stage-7" })
    expect(nextStageId({ ...stage, stages: stage.stages.slice(1) })).toBe("stage-1")
    expect(nextStageId(recalling({ from: "stage", id: "stage-3" }))).toBe("stage-4")
  })
})

describe("edited: a restore's gaps", () => {
  const at = { stage: 0, step: 1 }
  const restoring = edited(draft, {
    kind: "setParts",
    at,
    disclose: [],
    writing: null,
    recall: null,
    restore: { of: "words", gaps: ["l1 Bird", "l3 Worm"] },
  })
  const gaps = (practice: Practice) => practice.stages[0]!.steps[1]!.restore?.gaps

  it("adds a gap at a place in the restore, and takes one away", () => {
    const added = edited(restoring, { kind: "addGap", at, index: 1, gap: "l2 did" })
    expect(gaps(added)).toEqual(["l1 Bird", "l2 did", "l3 Worm"])
    expect(gaps(edited(added, { kind: "removeGap", at, index: 0 }))).toEqual(["l2 did", "l3 Worm"])
  })

  it("changes nothing for a step that does not restore, or a place the restore does not have", () => {
    const step = { stage: 0, step: 0 }
    expect(edited(restoring, { kind: "addGap", at: step, index: 0, gap: "l1 A" })).toBe(restoring)
    expect(edited(restoring, { kind: "addGap", at, index: 5, gap: "l1 A" })).toBe(restoring)
    expect(edited(restoring, { kind: "removeGap", at, index: 2 })).toBe(restoring)
  })
})
