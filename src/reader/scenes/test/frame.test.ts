import { describe, expect, it } from "vitest"
import type { Practice, Step } from "../../../practice/types"
import { annotateFrame, frameOf } from "../frame"

const consider = (note: string): Step => ({ verb: "consider", note, prose: [] })

/** Two stages of two steps each: the rests are at step 2. */
const practice: Practice = {
  id: "test",
  title: "Test",
  text: "fixture",
  stages: [
    { name: "First", steps: [consider("@a"), consider("@b")] },
    { name: "Second", steps: [consider("@c"), consider("@d")] },
  ],
}

const noSuchStep = { allowed: false, reason: { kind: "noSuchStep" } }
const finished = { allowed: false, reason: { kind: "finished" } }

describe("frameOf", () => {
  it("on a stage's first step: headed by the stage, nothing behind, the next step ahead", () => {
    expect(frameOf(practice, { stage: 1, step: 0, opensOn: null })).toEqual({
      position: { stage: 1, step: 0, opensOn: null },
      heading: "Second",
      back: noSuchStep,
      next: { allowed: true, to: 1 },
    })
  })

  it("on the last step: the rest is ahead", () => {
    const frame = frameOf(practice, { stage: 0, step: 1, opensOn: null })
    expect(frame.back).toEqual({ allowed: true, to: 0 })
    expect(frame.next).toEqual({ allowed: true, to: 2 })
  })

  it("at the rest, waiting: back to the last step, and the next stage not open until its day", () => {
    const frame = frameOf(practice, { stage: 0, step: 2, opensOn: "2026-11-12" })
    expect(frame.heading).toBe("First")
    expect(frame.back).toEqual({ allowed: true, to: 1 })
    expect(frame.next).toEqual({
      allowed: false,
      reason: { kind: "waiting", opensOn: "2026-11-12" },
    })
  })

  it("in the final stage: headed by the practice, and nowhere to go", () => {
    expect(frameOf(practice, { stage: 2, step: 0, opensOn: null })).toEqual({
      position: { stage: 2, step: 0, opensOn: null },
      heading: "Test",
      back: finished,
      next: finished,
    })
  })

  it("keeps the position it was given", () => {
    const position = { stage: 0, step: 1, opensOn: null }
    expect(frameOf(practice, position).position).toBe(position)
  })
})

describe("annotateFrame", () => {
  it("has no heading and never moves: no rulings at all, rather than refusals", () => {
    expect(annotateFrame.heading).toBeNull()
    expect(annotateFrame.back).toBeNull()
    expect(annotateFrame.next).toBeNull()
  })
})
