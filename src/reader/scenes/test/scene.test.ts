import { describe, expect, it } from "vitest"
import type { Note } from "../../../material/types"
import type { NoteId, ReaderNote } from "../../../notebook/types"
import type { Practice, Step } from "../../../practice/types"
import type { Standing } from "../../../runner/types"
import { annotateFrame, frameOf } from "../../frame/frame"
import { scene, type SceneState } from "../scene"
import type { Subject } from "../types"

// The scene as the frame drives it: subjects made by frameOf and annotateFrame, so these tests also
// show that the frame and the scene agree.

/** Where a run stands: at a position, with when the next stage opens and where it holds. */
const standing = (
  stage: number,
  step: number,
  opensOn: string | null = null,
  heldAt: number | null = null,
): Standing => ({ position: { stage, step }, opensOn, heldAt })

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

/** One stage: consider, consider, respond. The rest is at step 3; the final stage is stage 1. */
const practice: Practice = {
  id: "test",
  title: "Test",
  text: "poem",
  stages: [{ name: "Only", steps: [consider("@a"), consider("@b"), respond] }],
}

/** The subject of a frame of the practice, with what is in the notebook. */
const at = (stage: number, step: number, written: readonly ReaderNote[] = []) =>
  frameOf(practice, standing(stage, step), notes, written).subject

const tap = (index: number) => ({ kind: "tapNote", note: index }) as const
const close = { kind: "closeNote" } as const
const subject = (s: Subject) => ({ kind: "subject", subject: s }) as const

/** The scene, started on a subject: only its state, after checking it wrote nothing. */
function started(on: Subject): SceneState {
  const answer = scene.start(on)
  expect(answer.effects).toEqual([])
  return answer.state
}

describe("scene.start: each part staged", () => {
  it("on a consider step: its note picked out, closed; the prose; no writing", () => {
    const current = started(at(0, 1))
    expect(scene.viewer(current)).toEqual({ kind: "marked", text: "poem", marked: [2], open: null })
    expect(scene.praxisBar(current)).toEqual({ prose: ["On @b."], writing: null })
  })

  it("on a respond step: the poem with nothing picked out; the prose and a blank page", () => {
    const current = started(at(0, 2))
    expect(scene.viewer(current)).toEqual({ kind: "marked", text: "poem", marked: [], open: null })
    expect(scene.praxisBar(current)).toEqual({
      prose: ["What does the bird eat?"],
      writing: { kind: "writing", draft: "", canSubmit: false, canCancel: false },
    })
  })

  it("at the rest: the poem with nothing picked out, and nothing of its own in the praxis bar", () => {
    const current = started(at(0, 3))
    expect(scene.viewer(current)).toEqual({ kind: "marked", text: "poem", marked: [], open: null })
    expect(scene.praxisBar(current)).toBeNull()
  })

  it("in the final stage: the poem, and word that the practice is done", () => {
    expect(scene.praxisBar(started(at(1, 0)))).toEqual({
      prose: ["You have finished!"],
      writing: null,
    })
  })

  it("in annotate mode: every note listed, none open, nothing in the praxis bar", () => {
    const current = started(annotateFrame("poem", notes).subject)
    expect(scene.viewer(current)).toEqual({
      kind: "listed",
      text: "poem",
      shown: [0, 1, 2],
      open: null,
    })
    expect(scene.praxisBar(current)).toBeNull()
  })
})

describe("scene.fromViewer and fromPraxisBar", () => {
  it("opens the note by its highlight and closes it by its X", () => {
    const opened = scene.fromViewer(started(at(0, 1)), tap(2))
    expect(scene.viewer(opened.state).open).toBe(2)
    expect(scene.viewer(scene.fromViewer(opened.state, close).state).open).toBeNull()
  })

  it("gives back the very same state when nothing changed", () => {
    const current = started(at(0, 1))
    expect(scene.fromViewer(current, tap(0)).state).toBe(current)
    expect(scene.fromPraxisBar(current, { kind: "submit" }).state).toBe(current) // nothing to write
  })

  it("writes in the notebook on Respond, and only then", () => {
    let current = started(at(0, 2))
    const typing = scene.fromPraxisBar(current, { kind: "draft", text: "Worms." })
    expect(typing.effects).toEqual([])
    current = typing.state
    const sent = scene.fromPraxisBar(current, { kind: "submit" })
    expect(sent.effects).toEqual([
      { kind: "note", anchor: { kind: "whole", text: "poem" }, body: "Worms." },
    ])
    expect(scene.praxisBar(sent.state)?.writing).toEqual({ kind: "written", body: "Worms." })
  })
})

describe("scene.fromFrame: cuts and holds", () => {
  it("does nothing when the frame names the very subject the scene is on: the open note stays", () => {
    const step = at(0, 1)
    const current = scene.fromViewer(started(step), tap(2)).state
    const answer = scene.fromFrame(current, subject(step))
    expect(answer.state).toBe(current)
    expect(answer.effects).toEqual([])
  })

  it("cuts to a new frame: a new key starts the scene again", () => {
    const current = scene.fromViewer(started(at(0, 0)), tap(0)).state
    const answer = scene.fromFrame(current, subject(at(0, 1)))
    expect(answer.state.subject.key).toBe("test/0/1")
    expect(scene.viewer(answer.state).open).toBeNull()
  })

  it("holds on the same frame when the notebook changes: the open note and the page carry on", () => {
    const written: ReaderNote = {
      id: "n" as NoteId,
      anchor: { kind: "whole", text: "poem" },
      body: "Worms.",
      from: { practice: "test", stage: 0, step: 2 },
      writtenAt: 0,
      revisedAt: null,
    }
    let current = started(at(0, 2))
    current = scene.fromPraxisBar(current, { kind: "draft", text: "Worms." }).state
    current = scene.fromPraxisBar(current, { kind: "submit" }).state
    // The notebook now has the note: the frame hands over a fresh subject with the same key
    current = scene.fromFrame(current, subject(at(0, 2, [written]))).state
    expect(scene.praxisBar(current)?.writing).toEqual({ kind: "written", body: "Worms." })
    current = scene.fromPraxisBar(current, { kind: "edit" }).state
    expect(scene.praxisBar(current)?.writing).toEqual({
      kind: "writing",
      draft: "Worms.",
      canSubmit: false,
      canCancel: true,
    })
  })

  it("follows the frame through a practice: two steps, a page, the rest, the final stage", () => {
    let current = started(at(0, 0))
    expect(scene.viewer(current)).toEqual({ kind: "marked", text: "poem", marked: [0], open: null })
    current = scene.fromViewer(current, tap(0)).state

    current = scene.fromFrame(current, subject(at(0, 1))).state
    expect(scene.viewer(current)).toEqual({ kind: "marked", text: "poem", marked: [2], open: null })

    current = scene.fromFrame(current, subject(at(0, 2))).state
    expect(scene.praxisBar(current)?.writing?.kind).toBe("writing")

    current = scene.fromFrame(current, subject(at(0, 3))).state
    expect(scene.praxisBar(current)).toBeNull()

    current = scene.fromFrame(current, subject(at(1, 0))).state
    expect(scene.praxisBar(current)?.prose).toEqual(["You have finished!"])
  })

  it("follows a change of mode, to annotate mode and back to the practice", () => {
    const step = at(0, 1)
    let current = started(step)
    current = scene.fromFrame(current, subject(annotateFrame("poem", notes).subject)).state
    expect(scene.viewer(current).kind).toBe("listed")
    current = scene.fromViewer(current, tap(0)).state

    current = scene.fromFrame(current, subject(step)).state
    expect(scene.viewer(current)).toEqual({ kind: "marked", text: "poem", marked: [2], open: null })
  })
})
