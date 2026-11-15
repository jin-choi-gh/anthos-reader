import { describe, expect, it } from "vitest"
import type { Material } from "../../../material/materials"
import type { Fingerprint, Note } from "../../../material/types"
import type { NoteId, ReaderNote } from "../../../notebook/types"
import type { Practice, Step } from "../../../practice/types"
import type { Standing } from "../../../runner/types"
import { annotateFrame, frameOf } from "../frame"

/** Where a run stands: at a station, with when the next stage opens and where it holds. */
const standing = (
  stage: number,
  step: number,
  opensOn: string | null = null,
  heldAt: number | null = null,
): Standing => ({ station: { stage, step }, opensOn, heldAt })

/** A note as notesFor makes one, with only what these tests look at. */
const note = (index: number, id: string | null): Note => ({
  index,
  id,
  lemma: [],
  tags: [],
  paragraphs: [],
})

const notes = [note(0, "a"), note(1, null), note(2, "b")]

/** The material: two lines of poem, and the editor's notes. */
const material: Material = {
  substrate: { lines: ["A Bird, came down the Walk -", "He bit an Angle Worm in halves"] },
  fingerprint: "f" as Fingerprint,
  poem: { title: "Fixture", author: "", stanzas: [] },
  notes: { notes: notes, rangesOn: () => [] },
}

/** The whole of that poem. */
const whole = { start: { line: 0, offset: 0 }, end: { line: 1, offset: 30 } }

/** A note of the reader's on the whole poem, written on its lines unless said otherwise. */
const mine = (id: string, body: string, more: Partial<ReaderNote> = {}): ReaderNote => ({
  id: id as NoteId,
  targets: [whole],
  tags: [],
  body,
  fingerprint: "f" as Fingerprint,
  from: null,
  writtenAt: 0,
  revisedAt: null,
  ...more,
})

const consider = (ref: string): Step => ({
  direction: "consider",
  note: ref,
  prose: [`On ${ref}.`],
})
const respond: Step = { direction: "respond", prose: ["What does the bird eat?"] }

/** Two stages: the rests are at step 2 and step 3. "@missing" is in no note. */
const practice: Practice = {
  id: "test",
  title: "Test",
  text: "fixture",
  stages: [
    { name: "First", steps: [consider("@a"), consider("@b")] },
    { name: "Second", steps: [consider("@missing"), consider("@a"), respond] },
  ],
}

const noSuchStep = { allowed: false, reason: { kind: "noSuchStep" } }
const finished = { allowed: false, reason: { kind: "finished" } }

describe("frameOf: where the frame may go", () => {
  it("on a stage's first step: headed by the stage, nothing behind, the next step ahead", () => {
    const frame = frameOf(practice, standing(1, 0), material, [])
    expect(frame.heading).toBe("Second")
    expect(frame.back).toEqual(noSuchStep)
    expect(frame.next).toEqual({ allowed: true, to: 1 })
  })

  it("on the last step: the rest is ahead", () => {
    const frame = frameOf(practice, standing(0, 1), material, [])
    expect(frame.back).toEqual({ allowed: true, to: 0 })
    expect(frame.next).toEqual({ allowed: true, to: 2 })
  })

  it("at the rest, waiting: back to the last step, and the next stage not open until its day", () => {
    const frame = frameOf(practice, standing(0, 2, "2026-11-12"), material, [])
    expect(frame.heading).toBe("First")
    expect(frame.back).toEqual({ allowed: true, to: 1 })
    expect(frame.next).toEqual({
      allowed: false,
      reason: { kind: "waiting", opensOn: "2026-11-12" },
    })
  })

  it("held at a step that asks for writing: the runner refuses Next, as unanswered", () => {
    const frame = frameOf(practice, standing(1, 2, null, 2), material, [])
    expect(frame.next).toEqual({ allowed: false, reason: { kind: "unanswered" } })
  })

  it("in the final stage: headed by the practice, and nowhere to go", () => {
    const frame = frameOf(practice, standing(2, 0), material, [])
    expect(frame.heading).toBe("Test")
    expect(frame.back).toEqual(finished)
    expect(frame.next).toEqual(finished)
  })
})

describe("frameOf: the subject, made of parts, in the practice's text", () => {
  it("on a consider step: the highlight on the note its reference names, and the prose", () => {
    const { subject } = frameOf(practice, standing(0, 1), material, [])
    expect(subject).toEqual({
      key: "test/0/1",
      text: "fixture",
      prose: ["On @b."],
      commentary: { set: material.notes, notes: [notes[2]], shown: "marked", written: null },
      writing: null,
      noting: null,
    })
    expect(subject.commentary.notes[0]).toBe(notes[2])
  })

  it("on a consider step whose reference names no note: nothing picked out, still the prose", () => {
    const { subject } = frameOf(practice, standing(1, 0), material, [])
    expect(subject.commentary.notes).toEqual([])
    expect(subject.prose).toEqual(["On @missing."])
  })

  it("on a respond step: the prose, nothing picked out, and a page for one note on the poem", () => {
    const { subject } = frameOf(practice, standing(1, 2), material, [])
    expect(subject).toEqual({
      key: "test/1/2",
      text: "fixture",
      prose: ["What does the bird eat?"],
      commentary: { set: material.notes, notes: [], shown: "marked", written: null },
      writing: {
        about: { kind: "fixed", targets: [whole] },
        tags: [],
        count: "one",
        written: [],
      },
      noting: null,
    })
  })

  it("on a respond step: what the reader has written on that very step, and nothing else", () => {
    const written = (id: string, step: number): ReaderNote => ({
      id: id as NoteId,
      targets: [whole],
      tags: [],
      fingerprint: "f" as Fingerprint,
      body: "Worms.",
      from: { practice: "test", stage: 1, step },
      writtenAt: 0,
      revisedAt: null,
    })
    const here = written("here", 2)
    const { subject } = frameOf(practice, standing(1, 2), material, [written("elsewhere", 1), here])
    expect(subject.writing?.written).toEqual([here])
  })

  it("at the rest, whether waiting or not: nothing said and nothing asked", () => {
    for (const opensOn of [null, "2026-11-12"]) {
      const { subject } = frameOf(practice, standing(0, 2, opensOn), material, [])
      expect(subject).toEqual({
        key: "test/0/2",
        text: "fixture",
        prose: [],
        commentary: { set: material.notes, notes: [], shown: "marked", written: null },
        writing: null,
        noting: null,
      })
    }
  })

  it("in the final stage: word that the practice is done", () => {
    const { subject } = frameOf(practice, standing(2, 0), material, [])
    expect(subject.prose).toEqual(["You have finished!"])
    expect(subject.writing).toBeNull()
  })

  it("gives each frame its own key, and the same frame the same key", () => {
    const keys = [
      standing(0, 0),
      standing(0, 1),
      standing(0, 2),
      standing(1, 0),
      standing(2, 0),
    ].map((where) => frameOf(practice, where, material, []).subject.key)
    expect(new Set(keys).size).toBe(keys.length)
    expect(frameOf(practice, standing(0, 1, "2026-11-12"), material, []).subject.key).toBe(
      "test/0/1",
    )
  })
})

describe("frameOf: the set the editor's notes come from", () => {
  it("is the material's notes, and the notes picked out are notes of it", () => {
    const { commentary } = frameOf(practice, standing(0, 1), material, []).subject
    expect(commentary.set).toBe(material.notes)
    expect(commentary.notes.every((picked) => commentary.set.notes.includes(picked))).toBe(true)
  })
})

describe("annotateFrame: annotate mode", () => {
  it("has no heading and never moves: no rulings at all, rather than refusals", () => {
    const frame = annotateFrame("poem", material, [])
    expect(frame.heading).toBeNull()
    expect(frame.back).toBeNull()
    expect(frame.next).toBeNull()
  })

  it("lists the reader's own notes, in the order written, shown as the editor's are", () => {
    const written = [mine("n1", "Worms."), mine("n2", "Beads.\n\nFear.")]
    const { subject } = annotateFrame("poem", material, written)
    expect(subject).toMatchObject({ key: "annotate", text: "poem", prose: [], writing: null })
    const { set, notes: shown } = subject.commentary
    expect(subject.commentary.shown).toBe("listed")
    expect(shown).toBe(set.notes)
    const wholePoem = [{ kind: "citation", text: "the whole poem" }]
    expect(shown).toEqual([
      { index: 0, id: "n1", lemma: wholePoem, tags: [], paragraphs: ["Worms."] },
      { index: 1, id: "n2", lemma: wholePoem, tags: [], paragraphs: ["Beads.", "Fear."] },
    ])
  })

  it("shows none of the editor's notes: with nothing written, the list is empty", () => {
    const { commentary } = annotateFrame("poem", material, []).subject
    expect(commentary.notes).toEqual([])
    expect(commentary.set.notes).toEqual([])
  })

  it("leaves out a note written on other lines, and one whose target is not in the poem", () => {
    const elsewhere = mine("elsewhere", "Older.", { fingerprint: "g" as Fingerprint })
    const past = mine("past", "Broken.", {
      targets: [{ start: { line: 0, offset: 0 }, end: { line: 5, offset: 1 } }],
    })
    const { notes: shown } = annotateFrame("poem", material, [
      elsewhere,
      past,
      mine("kept", "Kept."),
    ]).subject.commentary
    expect(shown.map((note) => [note.index, note.id])).toEqual([[0, "kept"]])
  })
})

describe("noting: a new note on passages the reader chooses", () => {
  it("is in annotate mode, on the material's poem, and never in practice mode", () => {
    expect(annotateFrame("poem", material, []).subject.noting).toEqual({
      substrate: material.substrate,
      tags: [],
    })
    for (const [stage, step] of [
      [0, 0],
      [1, 2],
      [0, 2],
      [2, 0],
    ] as const) {
      expect(frameOf(practice, standing(stage, step), material, []).subject.noting).toBeNull()
    }
  })
})

describe("annotateFrame: the notes written in annotate mode, which can be deleted", () => {
  it("lists only the notes with no provenance, in the order written, and carries them in that order", () => {
    const first = mine("n1", "First.")
    const practised = mine("p", "Written in the practice.", {
      from: { practice: "test", stage: 0, step: 2 },
    })
    const second = mine("n2", "Second.")
    const { commentary } = annotateFrame("poem", material, [first, practised, second]).subject
    expect(commentary.notes.map((note) => [note.index, note.id])).toEqual([
      [0, "n1"],
      [1, "n2"],
    ])
    expect(commentary.written).toEqual([first, second])
  })

  it("carries none of the reader's notes in practice mode, so nothing there can be deleted", () => {
    expect(frameOf(practice, standing(0, 0), material, []).subject.commentary.written).toBeNull()
  })
})

describe("frameOf: an observe step, wherever the editor puts it", () => {
  const observe: Step = { direction: "observe", prose: ["Where does the bird change?"] }
  /** Observe first in a stage, and twice in a row after a respond. */
  const observing: Practice = {
    ...practice,
    stages: [
      { name: "First", steps: [observe, consider("@a")] },
      { name: "Second", steps: [respond, observe, observe] },
    ],
  }
  const bird = { start: { line: 0, offset: 2 }, end: { line: 0, offset: 6 } }
  const on = (stage: number, step: number, more: Partial<ReaderNote> = {}) =>
    mine(`${stage}/${step}`, "Fed.", {
      targets: [bird],
      from: { practice: "test", stage, step },
      ...more,
    })

  it("asks for one note on passages the reader chooses from the poem's lines, with no notes picked out", () => {
    const { subject } = frameOf(observing, standing(0, 0), material, [])
    expect(subject).toEqual({
      key: "test/0/0",
      text: "fixture",
      prose: ["Where does the bird change?"],
      commentary: { set: material.notes, notes: [], shown: "marked", written: null },
      writing: {
        about: { kind: "chosen", substrate: material.substrate },
        tags: [],
        count: "one",
        written: [],
      },
      noting: null,
    })
  })

  it("finds the note written on that very step, and not on the step beside it", () => {
    const notes = [on(1, 1), on(1, 2), on(0, 0)]
    expect(frameOf(observing, standing(1, 1), material, notes).subject.writing?.written).toEqual([
      notes[0],
    ])
    expect(frameOf(observing, standing(1, 2), material, notes).subject.writing?.written).toEqual([
      notes[1],
    ])
  })

  it("finds only a note written on these lines whose every target keeps the rule for spans", () => {
    const notes = [
      on(0, 0, { fingerprint: "g" as Fingerprint }),
      on(0, 0, {
        id: "bad" as NoteId,
        targets: [{ start: { line: 0, offset: 0 }, end: { line: 5, offset: 1 } }],
      }),
    ]
    expect(frameOf(observing, standing(0, 0), material, notes).subject.writing?.written).toEqual([])
  })

  it("leaves a respond step's note found, whatever lines it was written on", () => {
    const old = mine("r", "Worms.", {
      from: { practice: "test", stage: 1, step: 0 },
      fingerprint: "g" as Fingerprint,
    })
    expect(frameOf(observing, standing(1, 0), material, [old]).subject.writing?.written).toEqual([
      old,
    ])
  })
})
