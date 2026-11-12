import { describe, expect, it } from "vitest"
import type { Note } from "../../../material/types"
import { annotate } from "../annotate"
import type { SubjectOf } from "../types"

const note = (index: number): Note => ({ index, loomId: null, lemma: [], tags: [], paragraphs: [] })

const subject: SubjectOf<"annotate"> = {
  kind: "annotate",
  text: "poem",
  notes: [note(0), note(1), note(2)],
}
const at = (open: number | null) => ({ subject, open })
const tap = (index: number) => ({ kind: "tapNote", note: index }) as const
const silent = { toViewer: [], toPraxisBar: [] }

describe("annotate: what it shows", () => {
  it("starts with no note open, and says nothing to anyone", () => {
    expect(annotate.start(subject)).toEqual({ state: at(null), ...silent })
    expect(annotate.start(subject).state.subject).toBe(subject)
  })

  it("lists every note of its text, and which is open", () => {
    expect(annotate.viewer(at(null))).toEqual({
      kind: "listed",
      text: "poem",
      shown: [0, 1, 2],
      open: null,
    })
    expect(annotate.viewer(at(1)).open).toBe(1)
  })

  it("lists nothing for a text with no notes", () => {
    const bare = { subject: { ...subject, notes: [] }, open: null }
    expect(annotate.viewer(bare)).toEqual({ kind: "listed", text: "poem", shown: [], open: null })
  })

  it("has nothing of its own in the praxis bar", () => {
    expect(annotate.praxisBar(at(1))).toBeNull()
  })
})

describe("annotate: what the reader does", () => {
  it("opens a tapped note, and says nothing", () => {
    expect(annotate.fromViewer(at(null), tap(2))).toEqual({ state: at(2), ...silent })
  })

  it("opens a tapped note in place of the one that was open", () => {
    expect(annotate.fromViewer(at(0), tap(2)).state).toEqual(at(2))
  })

  it("closes the open note when it is tapped again", () => {
    expect(annotate.fromViewer(at(2), tap(2)).state).toEqual(at(null))
  })

  it("gives back the very same state for an X: its list has none", () => {
    const state = at(2)
    expect(annotate.fromViewer(state, { kind: "closeNote" }).state).toBe(state)
  })

  it("leaves the state it was given as it was, and keeps its subject", () => {
    const state = at(0)
    const answer = annotate.fromViewer(state, tap(1))
    expect(state).toEqual(at(0))
    expect(answer.state.subject).toBe(subject)
  })
})
