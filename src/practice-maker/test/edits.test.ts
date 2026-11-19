import { describe, expect, it } from "vitest"
import { REST } from "../../practice/parts"
import type { EditorsNote, Practice, Step } from "../../practice/types"
import { edited, nextNoteId, type Edit } from "../edits"

const note = (id: string): EditorsNote => ({ id, notehead: "l1", tags: [], body: id })
const say = (words: string, ...notes: EditorsNote[]): Step => ({
  ...REST,
  prose: [words],
  highlight: notes,
})

const draft: Practice = {
  id: "draft",
  title: "Draft",
  text: "dickinson",
  stages: [
    { name: "One", steps: [say("a", note("n1"), note("n2")), say("b")] },
    { name: "Two", steps: [say("c")] },
  ],
}

/** The words of each stage's steps, to see where steps went. */
const words = (practice: Practice) =>
  practice.stages.map((stage) => stage.steps.map((step) => step.prose.join(" ")))

describe("edited: one change to a draft", () => {
  it("retitles the practice", () => {
    expect(edited(draft, { kind: "retitle", title: "Renamed" }).title).toBe("Renamed")
  })

  it("adds a stage, with no steps, at any place from first to last", () => {
    const added = edited(draft, { kind: "addStage", at: 1, name: "Between" })
    expect(added.stages.map((stage) => stage.name)).toEqual(["One", "Between", "Two"])
    expect(added.stages[1]!.steps).toEqual([])
    const last = edited(draft, { kind: "addStage", at: 2, name: "Last" })
    expect(last.stages.map((stage) => stage.name)).toEqual(["One", "Two", "Last"])
  })

  it("renames, moves and removes a stage", () => {
    expect(edited(draft, { kind: "renameStage", stage: 1, name: "Second" }).stages[1]!.name).toBe(
      "Second",
    )
    expect(words(edited(draft, { kind: "moveStage", from: 0, to: 1 }))).toEqual([["c"], ["a", "b"]])
    expect(words(edited(draft, { kind: "removeStage", stage: 0 }))).toEqual([["c"]])
  })

  it("adds a step with no parts, which says and asks nothing", () => {
    const added = edited(draft, { kind: "addStep", at: { stage: 1, step: 0 } })
    expect(added.stages[1]!.steps).toEqual([REST, say("c")])
  })

  it("moves a step in its stage, counting its new place once it is taken out", () => {
    const moved = edited(draft, {
      kind: "moveStep",
      from: { stage: 0, step: 0 },
      to: { stage: 0, step: 1 },
    })
    expect(words(moved)).toEqual([["b", "a"], ["c"]])
  })

  it("moves a step into another stage, at any place from first to last", () => {
    const first = edited(draft, {
      kind: "moveStep",
      from: { stage: 0, step: 1 },
      to: { stage: 1, step: 0 },
    })
    expect(words(first)).toEqual([["a"], ["b", "c"]])
    const last = edited(draft, {
      kind: "moveStep",
      from: { stage: 0, step: 1 },
      to: { stage: 1, step: 1 },
    })
    expect(words(last)).toEqual([["a"], ["c", "b"]])
  })

  it("removes a step", () => {
    expect(words(edited(draft, { kind: "removeStep", at: { stage: 0, step: 0 } }))).toEqual([
      ["b"],
      ["c"],
    ])
  })

  it("sets a step's prose, writing and recall", () => {
    const at = { stage: 1, step: 0 }
    const writing = { target: "chosen", tags: ["gloss"], count: "one" } as const
    let changed = edited(draft, { kind: "setProse", at, prose: ["Look.", "Again."] })
    changed = edited(changed, { kind: "setWriting", at, writing })
    changed = edited(changed, { kind: "setRecall", at, recall: { from: "all" } })
    expect(changed.stages[1]!.steps[0]).toEqual({
      prose: ["Look.", "Again."],
      highlight: [],
      writing,
      recall: { from: "all" },
    })
    const unset = edited(changed, { kind: "setWriting", at, writing: null })
    expect(unset.stages[1]!.steps[0]!.writing).toBeNull()
  })

  it("adds, changes, moves and removes a step's editor's notes", () => {
    const at = { stage: 0, step: 0 }
    const ids = (practice: Practice) => practice.stages[0]!.steps[0]!.highlight.map((n) => n.id)
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
    const nowhere: Edit[] = [
      { kind: "addStage", at: 3, name: "Far" },
      { kind: "addStage", at: -1, name: "Before" },
      { kind: "renameStage", stage: 2, name: "None" },
      { kind: "moveStage", from: 0, to: 2 },
      { kind: "moveStage", from: 1, to: 1 },
      { kind: "removeStage", stage: 5 },
      { kind: "addStep", at: { stage: 1, step: 2 } },
      { kind: "addStep", at: { stage: 2, step: 0 } },
      { kind: "moveStep", from: { stage: 0, step: 2 }, to: { stage: 1, step: 0 } },
      { kind: "moveStep", from: { stage: 0, step: 0 }, to: { stage: 1, step: 2 } },
      { kind: "moveStep", from: { stage: 0, step: 0 }, to: { stage: 0, step: 2 } },
      { kind: "moveStep", from: { stage: 0, step: 0 }, to: { stage: 0, step: 0 } },
      { kind: "removeStep", at: { stage: 1, step: 1 } },
      { kind: "setProse", at: { stage: 0, step: 9 }, prose: [] },
      { kind: "setWriting", at: { stage: 3, step: 0 }, writing: null },
      { kind: "setRecall", at: { stage: 0, step: -1 }, recall: null },
      { kind: "addNote", at: { stage: 2, step: 0 }, note: note("x") },
      { kind: "changeNote", at: { stage: 0, step: 0 }, index: 2, note: note("x") },
      { kind: "moveNote", at: { stage: 0, step: 0 }, from: 0, to: 2 },
      { kind: "removeNote", at: { stage: 0, step: 1 }, index: 0 },
    ]
    for (const edit of nowhere) expect(edited(draft, edit), JSON.stringify(edit)).toBe(draft)
  })

  it("leaves the draft it was given as it was", () => {
    const before = JSON.stringify(draft)
    edited(draft, { kind: "removeStage", stage: 0 })
    edited(draft, { kind: "addNote", at: { stage: 0, step: 0 }, note: note("n9") })
    expect(JSON.stringify(draft)).toBe(before)
  })
})

describe("nextNoteId: the id for a new editor's note", () => {
  it("is the first of note-1, note-2, … that no note of the draft has", () => {
    expect(nextNoteId({ ...draft, stages: [] })).toBe("note-1")
    const used: Practice = {
      ...draft,
      stages: [
        {
          name: "One",
          steps: [say("a", note("note-1"), note("note-3")), say("b", note("note-2"))],
        },
      ],
    }
    expect(nextNoteId(used)).toBe("note-4")
    expect(
      nextNoteId({ ...used, stages: [{ name: "One", steps: [say("a", note("note-2"))] }] }),
    ).toBe("note-1")
  })
})
