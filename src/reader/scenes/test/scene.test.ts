import { describe, expect, it } from "vitest"
import type { Practice, Step } from "../../../practice/types"
import type { Note } from "../../types"
import { annotateFrame, frameOf } from "../../frame/frame"
import { scene, type SceneState } from "../scene"
import type { Subject } from "../types"

const note = (index: number, loomId: string | null): Note => ({
  index,
  loomId,
  lemma: [],
  tags: [],
  paragraphs: [],
})

const notes = [note(0, "a"), note(1, null), note(2, "b")]

const consider = (ref: string): Step => ({ verb: "consider", note: ref, prose: [`On ${ref}.`] })

/** One stage of two steps: the rest is at step 2, and the final stage is stage 1. */
const practice: Practice = {
  id: "test",
  title: "Test",
  text: "poem",
  stages: [{ name: "Only", steps: [consider("@a"), consider("@b")] }],
}

const tap = (index: number) => ({ kind: "tapNote", note: index }) as const
const close = { kind: "closeNote" } as const
const subject = (message: Subject) => ({ kind: "subject", subject: message }) as const
const silent = { toViewer: [], toPraxisBar: [] }

/** The scene, started on a subject: only its state, after checking it said nothing. */
function started(on: Subject): SceneState {
  const answer = scene.start(on)
  expect(answer).toMatchObject(silent)
  return answer.state
}

const considering: Subject = { kind: "consider", text: "poem", note: notes[2], prose: ["Look."] }
const resting: Subject = { kind: "rest", text: "poem" }
const finishing: Subject = { kind: "final", text: "poem" }
const annotating: Subject = { kind: "annotate", text: "poem", notes }

describe("scene.start: the behaviour for each kind of subject", () => {
  it("on a consider step: its note highlighted, closed; the prose in the praxis bar", () => {
    const current = started(considering)
    expect(current).toEqual({
      kind: "consider",
      subject: considering,
      state: { subject: considering, open: false },
    })
    expect(current.subject).toBe(considering)
    expect(scene.viewer(current)).toEqual({ kind: "marked", text: "poem", marked: [2], open: null })
    expect(scene.praxisBar(current)).toEqual({ kind: "prose", paragraphs: ["Look."] })
  })

  it("at the rest: the text with nothing highlighted, nothing of its own in the praxis bar", () => {
    const current = started(resting)
    expect(current).toEqual({ kind: "rest", subject: resting, state: resting })
    expect(scene.viewer(current)).toEqual({ kind: "marked", text: "poem", marked: [], open: null })
    expect(scene.praxisBar(current)).toBeNull()
  })

  it("in the final stage: the text, and word that the practice is done", () => {
    const current = started(finishing)
    expect(current).toEqual({ kind: "final", subject: finishing, state: finishing })
    expect(scene.viewer(current)).toEqual({ kind: "marked", text: "poem", marked: [], open: null })
    expect(scene.praxisBar(current)).toEqual({ kind: "prose", paragraphs: ["You have finished!"] })
  })

  it("in annotate mode: every note listed, none open", () => {
    const current = started(annotating)
    expect(current).toEqual({
      kind: "annotate",
      subject: annotating,
      state: { subject: annotating, open: null },
    })
    expect(scene.viewer(current)).toEqual({
      kind: "listed",
      text: "poem",
      shown: [0, 1, 2],
      open: null,
    })
    expect(scene.praxisBar(current)).toBeNull()
  })
})

describe("scene.fromViewer: passed to the behaviour", () => {
  it("on a consider step, opens the note by its highlight and closes it by its X", () => {
    const opened = scene.fromViewer(started(considering), tap(2))
    expect(opened).toMatchObject(silent)
    expect(scene.viewer(opened.state).open).toBe(2)
    expect(opened.state.subject).toBe(considering)

    const closed = scene.fromViewer(opened.state, close)
    expect(scene.viewer(closed.state).open).toBeNull()
  })

  it("in annotate mode, opens a tapped note and closes it again, keeping its subject", () => {
    const opened = scene.fromViewer(started(annotating), tap(1))
    expect(opened).toMatchObject(silent)
    expect(scene.viewer(opened.state).open).toBe(1)
    expect(opened.state.subject).toBe(annotating)

    const closed = scene.fromViewer(opened.state, tap(1))
    expect(scene.viewer(closed.state).open).toBeNull()
  })

  it("gives back the very same state when the behaviour changed nothing", () => {
    for (const on of [considering, resting, finishing, annotating]) {
      const current = started(on)
      const answer = scene.fromViewer(current, on === annotating ? close : tap(0))
      expect(answer).toMatchObject(silent)
      expect(answer.state).toBe(current)
    }
  })
})

describe("scene.fromFrame", () => {
  it("does nothing when the frame names the very subject the scene is on: the open note stays", () => {
    for (const [on, opening] of [
      [considering, tap(2)],
      [annotating, tap(2)],
    ] as const) {
      const current = scene.fromViewer(started(on), opening).state
      const answer = scene.fromFrame(current, subject(on))
      expect(answer).toMatchObject(silent)
      expect(answer.state).toBe(current)
      expect(scene.viewer(answer.state).open).toBe(2)
    }
  })

  it("starts again on a new subject, even one equal to the old: the frame has moved", () => {
    const current = scene.fromViewer(started(annotating), tap(2)).state
    const again: Subject = { kind: "annotate", text: "poem", notes }
    const answer = scene.fromFrame(current, subject(again))
    expect(answer).toMatchObject(silent)
    expect(answer.state.subject).toBe(again)
    expect(scene.viewer(answer.state).open).toBeNull()
  })

  it("follows the frame through a practice: two steps, the rest, the final stage", () => {
    const at = (stage: number, step: number) =>
      frameOf(practice, { stage, step, opensOn: null }, notes).subject

    let current = started(at(0, 0))
    expect(scene.viewer(current)).toEqual({ kind: "marked", text: "poem", marked: [0], open: null })
    current = scene.fromViewer(current, tap(0)).state

    current = scene.fromFrame(current, subject(at(0, 1))).state
    expect(scene.viewer(current)).toEqual({ kind: "marked", text: "poem", marked: [2], open: null })
    expect(scene.praxisBar(current)).toEqual({ kind: "prose", paragraphs: ["On @b."] })

    current = scene.fromFrame(current, subject(at(0, 2))).state
    expect(current.kind).toBe("rest")

    current = scene.fromFrame(current, subject(at(1, 0))).state
    expect(current.kind).toBe("final")
  })

  it("follows a change of mode, to annotate and back to the practice", () => {
    const step = frameOf(practice, { stage: 0, step: 1, opensOn: null }, notes).subject
    const annotateSubject = annotateFrame("poem", notes).subject

    let current = started(step)
    current = scene.fromFrame(current, subject(annotateSubject)).state
    expect(scene.viewer(current).kind).toBe("listed")
    current = scene.fromViewer(current, tap(0)).state

    current = scene.fromFrame(current, subject(step)).state
    expect(scene.viewer(current)).toEqual({ kind: "marked", text: "poem", marked: [2], open: null })
  })
})
