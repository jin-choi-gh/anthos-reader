import { describe, expect, it } from "vitest"
import type { Note } from "../../../material/types"
import { scene } from "../scene"
import type { Subject } from "../types"
import { receive } from "../useScene"

const note = (index: number): Note => ({ index, loomId: null, lemma: [], tags: [], paragraphs: [] })
const notes = [note(0), note(1)]

const considering: Subject = {
  key: "p/0/0",
  text: "poem",
  prose: ["Look."],
  commentary: { notes: [notes[1]!], shown: "marked" },
  writing: null,
}
const responding: Subject = {
  key: "p/0/1",
  text: "poem",
  prose: ["What does the bird eat?"],
  commentary: { notes: [], shown: "marked" },
  writing: { anchor: { kind: "whole", text: "poem" }, count: "one", written: [] },
}
const annotating: Subject = {
  key: "annotate",
  text: "poem",
  prose: [],
  commentary: { notes, shown: "listed" },
  writing: null,
}

const fromFrame = (subject: Subject) =>
  ({ from: "frame", message: { kind: "subject", subject } }) as const
const tap = (index: number) =>
  ({ from: "viewer", message: { kind: "tapNote", note: index } }) as const
const close = { from: "viewer", message: { kind: "closeNote" } } as const
const typed = (text: string) => ({ from: "praxisBar", message: { kind: "draft", text } }) as const
const submit = { from: "praxisBar", message: { kind: "submit" } } as const

describe("receive: envelopes from the frame", () => {
  it("keeps the very same state for the subject the scene is on, as when the mode first mounts", () => {
    const current = scene.start(considering).state
    expect(receive(current, fromFrame(considering))).toEqual({ state: current, effects: [] })
    expect(receive(current, fromFrame(considering)).state).toBe(current)
  })

  it("starts the scene again on a new subject", () => {
    const current = scene.start(considering).state
    expect(receive(current, fromFrame(annotating))).toEqual(scene.start(annotating))
  })
})

describe("receive: envelopes from the viewer", () => {
  it("passes them to the scene: the highlight's tap opens the note, the X closes it", () => {
    const opened = receive(scene.start(considering).state, tap(1)).state
    expect(scene.viewer(opened).open).toBe(1)
    expect(scene.viewer(receive(opened, close).state).open).toBeNull()
  })

  it("keeps the very same state when nothing changes, so React draws nothing again", () => {
    const current = scene.start(considering).state
    expect(receive(current, tap(0)).state).toBe(current)
    expect(receive(current, close).state).toBe(current)
  })
})

describe("receive: envelopes from the praxis bar", () => {
  it("keeps what is typed, and sends the note out only on Respond", () => {
    const writing = receive(scene.start(responding).state, typed("Worms.")).state
    expect(receive(scene.start(responding).state, typed("Worms.")).effects).toEqual([])
    expect(receive(writing, submit).effects).toEqual([
      { kind: "note", anchor: { kind: "whole", text: "poem" }, body: "Worms." },
    ])
  })
})

describe("receive: a walk", () => {
  it("follows envelopes in order, from the frame, the viewer and the praxis bar", () => {
    const envelopes = [tap(0), fromFrame(considering), tap(1), close, tap(1)]
    const end = envelopes.reduce(
      (current, envelope) => receive(current, envelope).state,
      scene.start(annotating).state,
    )
    expect(end.subject).toBe(considering)
    expect(scene.viewer(end).open).toBe(1)
  })
})
