import { describe, expect, it } from "vitest"
import type { Practice, Step } from "../../../practice/types"
import type { Note } from "../../types"
import { annotateFrame, frameOf } from "../frame"

/** A note as toNotes makes one, with only what these tests look at. */
const note = (index: number, loomId: string | null): Note => ({
  index,
  loomId,
  lemma: [],
  tags: [],
  paragraphs: [],
})

const notes = [note(0, "a"), note(1, null), note(2, "b")]

const consider = (ref: string): Step => ({ verb: "consider", note: ref, prose: [`On ${ref}.`] })

/** Two stages of two steps each: the rests are at step 2. "@missing" is in no note. */
const practice: Practice = {
  id: "test",
  title: "Test",
  text: "fixture",
  stages: [
    { name: "First", steps: [consider("@a"), consider("@b")] },
    { name: "Second", steps: [consider("@missing"), consider("@a")] },
  ],
}

const noSuchStep = { allowed: false, reason: { kind: "noSuchStep" } }
const finished = { allowed: false, reason: { kind: "finished" } }

describe("frameOf: where the frame may go", () => {
  it("on a stage's first step: headed by the stage, nothing behind, the next step ahead", () => {
    const frame = frameOf(practice, { stage: 1, step: 0, opensOn: null }, notes)
    expect(frame.position).toEqual({ stage: 1, step: 0, opensOn: null })
    expect(frame.heading).toBe("Second")
    expect(frame.back).toEqual(noSuchStep)
    expect(frame.next).toEqual({ allowed: true, to: 1 })
  })

  it("on the last step: the rest is ahead", () => {
    const frame = frameOf(practice, { stage: 0, step: 1, opensOn: null }, notes)
    expect(frame.back).toEqual({ allowed: true, to: 0 })
    expect(frame.next).toEqual({ allowed: true, to: 2 })
  })

  it("at the rest, waiting: back to the last step, and the next stage not open until its day", () => {
    const frame = frameOf(practice, { stage: 0, step: 2, opensOn: "2026-11-12" }, notes)
    expect(frame.heading).toBe("First")
    expect(frame.back).toEqual({ allowed: true, to: 1 })
    expect(frame.next).toEqual({
      allowed: false,
      reason: { kind: "waiting", opensOn: "2026-11-12" },
    })
  })

  it("in the final stage: headed by the practice, and nowhere to go", () => {
    const frame = frameOf(practice, { stage: 2, step: 0, opensOn: null }, notes)
    expect(frame.heading).toBe("Test")
    expect(frame.back).toEqual(finished)
    expect(frame.next).toEqual(finished)
  })

  it("keeps the position it was given", () => {
    const position = { stage: 0, step: 1, opensOn: null }
    expect(frameOf(practice, position, notes).position).toBe(position)
  })
})

describe("frameOf: what the frame is fixed on, always in the practice's text", () => {
  it("on a consider step: the note its reference names, and the step's prose", () => {
    const { subject } = frameOf(practice, { stage: 0, step: 1, opensOn: null }, notes)
    expect(subject).toEqual({
      kind: "consider",
      text: "fixture",
      note: notes[2],
      prose: ["On @b."],
    })
    expect(subject.kind === "consider" && subject.note).toBe(notes[2])
  })

  it("on a consider step whose reference names no note: no note, and still the prose", () => {
    const { subject } = frameOf(practice, { stage: 1, step: 0, opensOn: null }, notes)
    expect(subject).toEqual({
      kind: "consider",
      text: "fixture",
      note: null,
      prose: ["On @missing."],
    })
  })

  it("at the rest, whether waiting or not", () => {
    for (const opensOn of [null, "2026-11-12"]) {
      const { subject } = frameOf(practice, { stage: 0, step: 2, opensOn }, notes)
      expect(subject).toEqual({ kind: "rest", text: "fixture" })
    }
  })

  it("in the final stage", () => {
    const { subject } = frameOf(practice, { stage: 2, step: 0, opensOn: null }, notes)
    expect(subject).toEqual({ kind: "final", text: "fixture" })
  })
})

describe("annotateFrame", () => {
  it("has no heading and never moves: no rulings at all, rather than refusals", () => {
    const frame = annotateFrame("poem", notes)
    expect(frame.heading).toBeNull()
    expect(frame.back).toBeNull()
    expect(frame.next).toBeNull()
  })

  it("is fixed on the text it is given, and all its notes, as given", () => {
    const { subject } = annotateFrame("poem", notes)
    expect(subject).toEqual({ kind: "annotate", text: "poem", notes })
    expect(subject.kind === "annotate" && subject.notes).toBe(notes)
  })
})
