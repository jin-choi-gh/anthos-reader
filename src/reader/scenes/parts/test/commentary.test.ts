import { describe, expect, it } from "vitest"
import type { Note } from "../../../../material/types"
import type { Commentary } from "../../types"
import { keepOpen, onViewer, viewerOf } from "../commentary"

const note = (index: number): Note => ({ index, loomId: null, lemma: [], tags: [], paragraphs: [] })

/** The iris on one note, as on a consider step; and the list of three, as at the viewing table. */
const iris: Commentary = { notes: [note(2)], shown: "marked" }
const list: Commentary = { notes: [note(0), note(1), note(2)], shown: "listed" }
const none: Commentary = { notes: [], shown: "marked" }

const tap = (index: number) => ({ kind: "tapNote", note: index }) as const
const close = { kind: "closeNote" } as const

describe("the iris: one note picked out in the poem", () => {
  it("opens its note when the highlight is tapped, and closes it when tapped again", () => {
    expect(onViewer(iris, null, tap(2))).toBe(2)
    expect(onViewer(iris, 2, tap(2))).toBeNull()
  })

  it("closes its note by its X", () => {
    expect(onViewer(iris, 2, close)).toBeNull()
  })

  it("changes nothing for a tap on a note it does not show", () => {
    expect(onViewer(iris, null, tap(0))).toBeNull()
    expect(onViewer(iris, 2, tap(0))).toBe(2)
  })

  it("picks out nothing, and can open nothing, when its reference named no note", () => {
    expect(viewerOf("poem", none, null)).toEqual({
      kind: "marked",
      text: "poem",
      marked: [],
      open: null,
    })
    expect(onViewer(none, null, tap(2))).toBeNull()
  })

  it("is drawn marked in the poem, closed until the reader opens it", () => {
    expect(viewerOf("poem", iris, null)).toEqual({
      kind: "marked",
      text: "poem",
      marked: [2],
      open: null,
    })
    expect(viewerOf("poem", iris, 2)).toEqual({
      kind: "marked",
      text: "poem",
      marked: [2],
      open: 2,
    })
  })
})

describe("the list: every note beside the poem, at the viewing table", () => {
  it("opens a tapped note, in place of the one that was open, and closes it when tapped again", () => {
    expect(onViewer(list, null, tap(0))).toBe(0)
    expect(onViewer(list, 0, tap(1))).toBe(1)
    expect(onViewer(list, 1, tap(1))).toBeNull()
  })

  it("has no X: closing changes nothing", () => {
    expect(onViewer(list, 1, close)).toBe(1)
  })

  it("is drawn as a list, with the open note", () => {
    expect(viewerOf("poem", list, 1)).toEqual({
      kind: "listed",
      text: "poem",
      shown: [0, 1, 2],
      open: 1,
    })
  })
})

describe("keepOpen: the open note, when the commentary is fresh", () => {
  it("stays open while it is still shown, and closes when it is not", () => {
    expect(keepOpen(iris, 2)).toBe(2)
    expect(keepOpen(none, 2)).toBeNull()
    expect(keepOpen(iris, null)).toBeNull()
  })
})
