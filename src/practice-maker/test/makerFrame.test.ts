import { describe, expect, it } from "vitest"
import type { Material } from "../../material/materials"
import { spansOfNotehead } from "../../material/noteheads"
import type { Fingerprint } from "../../material/types"
import { REST } from "../../practice/parts"
import { practiceOf } from "../../practice/test/build"
import { scene } from "../../reader/scenes/scene"
import { editOfNote, editOfPick, makerFrame, noteOf, pickingOf } from "../makerFrame"

const material: Material = {
  substrate: {
    lines: [
      { id: "l1", text: "A Bird, came down the Walk -" },
      { id: "l2", text: "He bit an Angle Worm in halves" },
    ],
  },
  words: [],
  fingerprint: "f" as Fingerprint,
  poem: { title: "Fixture", author: "", stanzas: [] },
}

const draft = practiceOf({
  id: "draft",
  title: "Draft",
  text: "fixture",
  stages: [
    {
      name: "One",
      steps: [
        {
          ...REST,
          prose: ["Look at the worm."],
          highlight: [{ id: "worm", notehead: "l2 Worm", tags: ["gloss"], body: "The worm." }],
        },
        { ...REST, prose: ["Why?"], writing: { target: "whole", tags: [], count: "one" } },
      ],
    },
  ],
})

describe("makerFrame: the subject of the step being made", () => {
  it("shows the step's prose and its editor's notes, picked out, with a noting and no writing", () => {
    const subject = makerFrame(draft, "step-1", material, { noting: true })
    expect(subject).toMatchObject({
      key: "form/step-1",
      text: "fixture",
      prose: ["Look at the worm."],
      writing: null,
      noting: { substrate: material.substrate, tags: [] },
    })
    expect(subject.commentary).toMatchObject({ shown: "marked", written: null, recalled: null })
    expect(subject.commentary.notes).toEqual([
      {
        index: 0,
        id: "worm",
        lemma: [{ kind: "quote", text: "Worm" }],
        tags: ["gloss"],
        paragraphs: ["The worm."],
      },
    ])
    expect(subject.commentary.notes).toBe(subject.commentary.set.notes)
  })

  it("leaves out a writing the step asks of the reader: the editor writes notes, not answers", () => {
    expect(makerFrame(draft, "step-2", material, { noting: true }).writing).toBeNull()
  })

  it("is keyed by the step's id, so another step starts the scene afresh, and a moved one does not", () => {
    expect(makerFrame(draft, "step-2", material, { noting: true }).key).toBe("form/step-2")
    const moved = {
      ...draft,
      stages: [{ ...draft.stages[0]!, steps: [...draft.stages[0]!.steps].reverse() }],
    }
    expect(makerFrame(moved, "step-1", material, { noting: true }).key).toBe("form/step-1")
  })

  it("leaves out the note taken up to be written again, so that it is not drawn twice", () => {
    const subject = makerFrame(draft, "step-1", material, { noting: true, inHand: "worm" })
    expect(subject.commentary.notes).toEqual([])
    expect(subject.key).toBe("form/step-1")
  })

  it("has no noting unless the step highlights, so the scene lets go of choosing", () => {
    expect(makerFrame(draft, "step-1", material, { noting: false }).noting).toBeNull()
  })

  it("is the poem alone with no step, or none with that id", () => {
    for (const id of [null, "gone"]) {
      expect(makerFrame(draft, id, material, { noting: true })).toMatchObject({
        key: "form",
        prose: [],
        commentary: { notes: [] },
        noting: null,
      })
    }
  })
})

describe("noteOf: a noting's new note as an editor's note", () => {
  it("writes its targets as a notehead that places them again, with the id given", () => {
    const worm = { start: { line: 1, offset: 10 }, end: { line: 1, offset: 20 } }
    const effect = { kind: "note", targets: [worm], tags: [], body: "Angle worm." } as const
    const note = noteOf(effect, material.substrate, "note-1")
    expect(note).toEqual({ id: "note-1", notehead: "l2 Angle Worm", tags: [], body: "Angle worm." })
    expect(spansOfNotehead(material.substrate, note!.notehead)).toEqual({ spans: [worm] })
  })

  it("is none for targets no notehead can write", () => {
    const point = { start: { line: 0, offset: 2 }, end: { line: 0, offset: 2 } }
    expect(
      noteOf({ kind: "note", targets: [point], tags: [], body: "x" }, material.substrate, "n"),
    ).toBeNull()
  })

  it("takes the note the Scene sends out when the editor adds one on chosen passages", () => {
    const subject = makerFrame(draft, "step-1", material, { noting: true })
    let state = scene.start(subject).state
    state = scene.fromPraxisBar(state, { kind: "choosing", on: true }).state
    const bird = { start: { line: 0, offset: 2 }, end: { line: 0, offset: 6 } }
    state = scene.fromViewer(state, { kind: "choose", span: bird }).state
    state = scene.fromPraxisBar(state, { kind: "noteDraft", text: "  The bird.  " }).state
    const [effect] = scene.fromPraxisBar(state, { kind: "addNote" }).effects
    expect(effect?.kind).toBe("note")
    if (effect?.kind !== "note") return
    expect(noteOf(effect, material.substrate, "note-1")).toEqual({
      id: "note-1",
      notehead: "l1 Bird",
      tags: [],
      body: "The bird.",
    })
  })
})

describe("editOfNote: what a note sent out by the noting does to the step", () => {
  const at = { stage: 0, step: 0 }
  const bird = { start: { line: 0, offset: 2 }, end: { line: 0, offset: 6 } }
  const effect = { kind: "note", targets: [bird], tags: [], body: "The bird." } as const

  it("adds a new editor's note, with the first id the draft does not use", () => {
    expect(editOfNote(draft, at, null, effect, material.substrate)).toEqual({
      kind: "addNote",
      at,
      note: { id: "note-1", notehead: "l1 Bird", tags: [], body: "The bird." },
    })
  })

  it("changes the note in hand in its place, keeping its id and its tags", () => {
    expect(editOfNote(draft, at, "worm", effect, material.substrate)).toEqual({
      kind: "changeNote",
      at,
      index: 0,
      note: { id: "worm", notehead: "l1 Bird", tags: ["gloss"], body: "The bird." },
    })
  })

  it("adds a new note when the note in hand is no longer the step's", () => {
    expect(editOfNote(draft, at, "gone", effect, material.substrate)?.kind).toBe("addNote")
  })

  it("is none for a step that is not there", () => {
    expect(editOfNote(draft, { stage: 0, step: 5 }, null, effect, material.substrate)).toBeNull()
  })
})

describe("a step that restores, in Form Practice", () => {
  const lines = ["A Bird, came down the Walk -", "Hope", "the bird, the worm"]
  const words = (line: number, text: string) =>
    [...text.matchAll(/[\p{L}\p{N}]+/gu)].map((match) => ({
      start: { line, offset: match.index },
      end: { line, offset: match.index + match[0].length },
    }))
  const poem: Material = {
    ...material,
    substrate: { lines: lines.map((text, i) => ({ id: `l${i + 1}`, text })) },
    words: lines.flatMap((text, line) => words(line, text)),
  }
  const restoring = (of: "words" | "lines", ...gaps: string[]) =>
    practiceOf({
      id: "draft",
      title: "Draft",
      text: "fixture",
      stages: [
        { name: "One", steps: [{ ...REST, prose: ["Put them back."], restore: { of, gaps } }] },
      ],
    })
  const at = { stage: 0, step: 0 }
  const span = (line: number, start: number, end: number) => ({
    start: { line, offset: start },
    end: { line, offset: end },
  })

  it("gives its subject a picking of the poem's words, each saying whether a gap takes it out", () => {
    const subject = makerFrame(restoring("words", "l1 Walk"), "step-1", poem, { noting: false })
    expect(subject.picking?.of).toBe("words")
    expect(subject.picking?.units.map((unit) => unit.taken)).toEqual([
      ...[false, false, false, false, false, true],
      false,
      ...[false, false, false, false],
    ])
  })

  it("gives a picking of the lines with text, whole, when the restore takes out lines", () => {
    const picking = pickingOf({ of: "lines", gaps: ["l2"] }, poem)
    expect(picking.units).toEqual([
      { span: span(0, 0, 28), taken: false },
      { span: span(1, 0, 4), taken: true },
      { span: span(2, 0, 18), taken: false },
    ])
  })

  it("gives no picking to a step that does not restore", () => {
    expect(makerFrame(draft, "step-1", material, { noting: true }).picking).toBeNull()
  })

  it("makes a gap of a word picked, before the first gap after it in the poem", () => {
    const practice = restoring("words", "l1 Walk")
    expect(editOfPick(practice, at, span(0, 2, 6), poem.substrate)).toEqual({
      kind: "addGap",
      at,
      gap: "l1 Bird",
      index: 0,
    })
    expect(editOfPick(practice, at, span(2, 4, 8), poem.substrate)).toEqual({
      kind: "addGap",
      at,
      gap: "l3 bird",
      index: 1,
    })
  })

  it("writes a repeated word by its occurrence, and a line of one word as the line", () => {
    const practice = restoring("words")
    expect(editOfPick(practice, at, span(2, 10, 13), poem.substrate)).toMatchObject({
      gap: "l3 the[2]",
    })
    expect(editOfPick(practice, at, span(1, 0, 4), poem.substrate)).toMatchObject({ gap: "l2" })
  })

  it("takes the gap away when the word picked is one a gap takes out, however it is written", () => {
    const practice = restoring("words", "l3 bird", "l3 the[2]", "l2 Hope")
    expect(editOfPick(practice, at, span(2, 10, 13), poem.substrate)).toEqual({
      kind: "removeGap",
      at,
      index: 1,
    })
    expect(editOfPick(practice, at, span(1, 0, 4), poem.substrate)).toEqual({
      kind: "removeGap",
      at,
      index: 2,
    })
  })

  it("makes no edit for a step that does not restore", () => {
    expect(editOfPick(draft, at, span(0, 2, 6), poem.substrate)).toBeNull()
  })
})
