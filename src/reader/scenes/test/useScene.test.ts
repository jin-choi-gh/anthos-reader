import { describe, expect, it } from "vitest"
import type { Note } from "../../../material/types"
import { scene } from "../scene"
import type { Subject } from "../types"
import { sceneReducer } from "../useScene"

const note = (index: number): Note => ({ index, loomId: null, lemma: [], tags: [], paragraphs: [] })
const notes = [note(0), note(1)]

const considering: Subject = { kind: "consider", text: "poem", note: notes[1], prose: ["Look."] }
const annotating: Subject = { kind: "annotate", text: "poem", notes }

const fromFrame = (subject: Subject) =>
  ({ from: "frame", message: { kind: "subject", subject } }) as const
const tap = (index: number) =>
  ({ from: "viewer", message: { kind: "tapNote", note: index } }) as const
const close = { from: "viewer", message: { kind: "closeNote" } } as const

describe("sceneReducer: envelopes from the frame", () => {
  it("keeps the very same state for the subject the scene is on, as when the mode first mounts", () => {
    const current = scene.start(considering).state
    expect(sceneReducer(current, fromFrame(considering))).toBe(current)
  })

  it("starts the scene again on a new subject", () => {
    const current = scene.start(considering).state
    expect(sceneReducer(current, fromFrame(annotating))).toEqual(scene.start(annotating).state)
  })
})

describe("sceneReducer: envelopes from the viewer", () => {
  it("passes them to the scene: the highlight's tap opens the note, the X closes it", () => {
    const opened = sceneReducer(scene.start(considering).state, tap(1))
    expect(scene.viewer(opened).open).toBe(1)
    expect(scene.viewer(sceneReducer(opened, close)).open).toBeNull()
  })

  it("keeps the very same state when nothing changes, so React draws nothing again", () => {
    const current = scene.start(considering).state
    expect(sceneReducer(current, tap(0))).toBe(current)
    expect(sceneReducer(current, close)).toBe(current)
  })

  it("follows a walk of envelopes in order, from the frame and the viewer", () => {
    const envelopes = [tap(0), fromFrame(considering), tap(1), close, tap(1)]
    const end = envelopes.reduce(sceneReducer, scene.start(annotating).state)
    expect(end.kind).toBe("consider")
    expect(scene.viewer(end).open).toBe(1)
  })
})
