import { describe, expect, it } from "vitest"
import type { Note } from "../../../../../material/types"
import type { SubjectOf } from "../../../types"
import { consider, type ConsiderState } from "../consider"

const note: Note = { index: 3, loomId: "beads", lemma: [], tags: [], paragraphs: ["A note."] }
const subject: SubjectOf<"consider"> = {
  kind: "consider",
  text: "poem",
  note,
  prose: ["Look at the beads.", "Then?"],
}
const missing: SubjectOf<"consider"> = { kind: "consider", text: "poem", note: null, prose: [] }

const closed: ConsiderState = { subject, open: false }
const opened: ConsiderState = { subject, open: true }
const tap = (index: number) => ({ kind: "tapNote", note: index }) as const
const close = { kind: "closeNote" } as const
const silent = { toViewer: [], toPraxisBar: [] }

describe("consider: what it shows", () => {
  it("starts with its note closed, and says nothing to anyone", () => {
    expect(consider.start(subject)).toEqual({ state: closed, ...silent })
    expect(consider.start(subject).state.subject).toBe(subject)
  })

  it("highlights its note in its text, closed until the reader opens it", () => {
    expect(consider.viewer(closed)).toEqual({
      kind: "marked",
      text: "poem",
      marked: [3],
      open: null,
    })
    expect(consider.viewer(opened)).toEqual({ kind: "marked", text: "poem", marked: [3], open: 3 })
  })

  it("highlights nothing when its reference named no note, and can open nothing", () => {
    const state = { subject: missing, open: false }
    expect(consider.viewer(state)).toEqual({ kind: "marked", text: "poem", marked: [], open: null })
    expect(consider.fromViewer(state, tap(3)).state).toBe(state)
  })

  it("shows the editor's prose in the praxis bar, open or not", () => {
    for (const state of [closed, opened]) {
      expect(consider.praxisBar(state)).toEqual({
        kind: "prose",
        paragraphs: ["Look at the beads.", "Then?"],
      })
    }
  })
})

describe("consider: what the reader does", () => {
  it("opens its note when the highlight is tapped, and closes it when tapped again", () => {
    const opening = consider.fromViewer(closed, tap(3))
    expect(opening).toEqual({ state: opened, ...silent })
    expect(opening.state.subject).toBe(subject)
    expect(consider.fromViewer(opened, tap(3))).toEqual({ state: closed, ...silent })
  })

  it("closes its note by its X", () => {
    expect(consider.fromViewer(opened, close)).toEqual({ state: closed, ...silent })
  })

  it("gives back the very same state when nothing changes: another note tapped, or X when closed", () => {
    for (const state of [closed, opened]) {
      expect(consider.fromViewer(state, tap(0)).state).toBe(state)
    }
    expect(consider.fromViewer(closed, close)).toEqual({ state: closed, ...silent })
    expect(consider.fromViewer(closed, close).state).toBe(closed)
  })
})
