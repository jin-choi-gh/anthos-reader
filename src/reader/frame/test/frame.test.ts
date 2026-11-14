import { describe, expect, it } from "vitest"
import type { Note } from "../../../material/types"
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

/** A note as toNotes makes one, with only what these tests look at. */
const note = (index: number, loomId: string | null): Note => ({
  index,
  loomId,
  lemma: [],
  tags: [],
  paragraphs: [],
})

const notes = [note(0, "a"), note(1, null), note(2, "b")]

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
    const frame = frameOf(practice, standing(1, 0), notes, [])
    expect(frame.heading).toBe("Second")
    expect(frame.back).toEqual(noSuchStep)
    expect(frame.next).toEqual({ allowed: true, to: 1 })
  })

  it("on the last step: the rest is ahead", () => {
    const frame = frameOf(practice, standing(0, 1), notes, [])
    expect(frame.back).toEqual({ allowed: true, to: 0 })
    expect(frame.next).toEqual({ allowed: true, to: 2 })
  })

  it("at the rest, waiting: back to the last step, and the next stage not open until its day", () => {
    const frame = frameOf(practice, standing(0, 2, "2026-11-12"), notes, [])
    expect(frame.heading).toBe("First")
    expect(frame.back).toEqual({ allowed: true, to: 1 })
    expect(frame.next).toEqual({
      allowed: false,
      reason: { kind: "waiting", opensOn: "2026-11-12" },
    })
  })

  it("held at a step that asks for writing: the runner refuses Next, as unanswered", () => {
    const frame = frameOf(practice, standing(1, 2, null, 2), notes, [])
    expect(frame.next).toEqual({ allowed: false, reason: { kind: "unanswered" } })
  })

  it("in the final stage: headed by the practice, and nowhere to go", () => {
    const frame = frameOf(practice, standing(2, 0), notes, [])
    expect(frame.heading).toBe("Test")
    expect(frame.back).toEqual(finished)
    expect(frame.next).toEqual(finished)
  })
})

describe("frameOf: the subject, made of parts, in the practice's text", () => {
  it("on a consider step: the highlight on the note its reference names, and the prose", () => {
    const { subject } = frameOf(practice, standing(0, 1), notes, [])
    expect(subject).toEqual({
      key: "test/0/1",
      text: "fixture",
      prose: ["On @b."],
      commentary: { notes: [notes[2]], shown: "marked" },
      writing: null,
    })
    expect(subject.commentary.notes[0]).toBe(notes[2])
  })

  it("on a consider step whose reference names no note: nothing picked out, still the prose", () => {
    const { subject } = frameOf(practice, standing(1, 0), notes, [])
    expect(subject.commentary.notes).toEqual([])
    expect(subject.prose).toEqual(["On @missing."])
  })

  it("on a respond step: the prose, nothing picked out, and a page for one note on the poem", () => {
    const { subject } = frameOf(practice, standing(1, 2), notes, [])
    expect(subject).toEqual({
      key: "test/1/2",
      text: "fixture",
      prose: ["What does the bird eat?"],
      commentary: { notes: [], shown: "marked" },
      writing: { anchor: { kind: "whole", text: "fixture" }, count: "one", written: [] },
    })
  })

  it("on a respond step: what the reader has written on that very step, and nothing else", () => {
    const written = (id: string, step: number): ReaderNote => ({
      id: id as NoteId,
      anchor: { kind: "whole", text: "fixture" },
      body: "Worms.",
      from: { practice: "test", stage: 1, step },
      writtenAt: 0,
      revisedAt: null,
    })
    const here = written("here", 2)
    const { subject } = frameOf(practice, standing(1, 2), notes, [written("elsewhere", 1), here])
    expect(subject.writing?.written).toEqual([here])
  })

  it("at the rest, whether waiting or not: nothing said and nothing asked", () => {
    for (const opensOn of [null, "2026-11-12"]) {
      const { subject } = frameOf(practice, standing(0, 2, opensOn), notes, [])
      expect(subject).toEqual({
        key: "test/0/2",
        text: "fixture",
        prose: [],
        commentary: { notes: [], shown: "marked" },
        writing: null,
      })
    }
  })

  it("in the final stage: word that the practice is done", () => {
    const { subject } = frameOf(practice, standing(2, 0), notes, [])
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
    ].map((where) => frameOf(practice, where, notes, []).subject.key)
    expect(new Set(keys).size).toBe(keys.length)
    expect(frameOf(practice, standing(0, 1, "2026-11-12"), notes, []).subject.key).toBe("test/0/1")
  })
})

describe("annotateFrame: annotate mode", () => {
  it("has no heading and never moves: no rulings at all, rather than refusals", () => {
    const frame = annotateFrame("poem", notes)
    expect(frame.heading).toBeNull()
    expect(frame.back).toBeNull()
    expect(frame.next).toBeNull()
  })

  it("lists all the text's notes, as given, and asks for nothing", () => {
    const { subject } = annotateFrame("poem", notes)
    expect(subject).toEqual({
      key: "annotate",
      text: "poem",
      prose: [],
      commentary: { notes, shown: "listed" },
      writing: null,
    })
    expect(subject.commentary.notes).toBe(notes)
  })
})
