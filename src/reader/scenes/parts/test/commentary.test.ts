import { describe, expect, it } from "vitest"
import type { Fingerprint, Note, Notes } from "../../../../material/types"
import type { NoteId, ReaderNote } from "../../../../notebook/types"
import type { Commentary } from "../../types"
import { keepOpen, onViewer, viewerOf, type OpenNote } from "../commentary"

const note = (index: number, id: string | null = null): Note => ({
  index,
  id,
  lemma: [],
  tags: [],
  paragraphs: [],
})

/** The editor's three notes, without ids: one picked out, as on a step that highlights it, or none. */
const set: Notes = { notes: [note(0), note(1), note(2)], rangesOn: () => [] }
const highlight: Commentary = {
  set,
  notes: [note(2)],
  shown: "marked",
  written: null,
  recalled: null,
  disclosed: null,
}
const none: Commentary = {
  set,
  notes: [],
  shown: "marked",
  written: null,
  recalled: null,
  disclosed: null,
}

/** One of the reader's own notes, written in annotate mode. */
const mine = (id: string): ReaderNote => ({
  id: id as NoteId,
  targets: [],
  tags: [],
  body: id,
  fingerprint: "f" as Fingerprint,
  from: null,
  writtenAt: 0,
  revisedAt: null,
})

/** The reader's own notes, listed in the order given, as in annotate mode. */
function listOf(ids: string[]): Commentary {
  const notes = ids.map((id, index) => note(index, id))
  return {
    set: { notes, rangesOn: () => [] },
    notes,
    shown: "listed",
    written: ids.map(mine),
    recalled: null,
    disclosed: null,
  }
}
const list = listOf(["a", "b", "c"])

const tap = (index: number) => ({ kind: "tapNote", note: index }) as const
const close = { kind: "closeNote" } as const
const deleting = (id: string) => ({ kind: "deleteNote", id }) as const
const at = (index: number, id: string | null = null): OpenNote => ({ index, id })

describe("the highlight: one of the editor's notes lit up in the poem", () => {
  it("opens its note when the highlight is tapped, and closes it when tapped again", () => {
    expect(onViewer(highlight, null, tap(2))).toEqual({ open: at(2), effects: [] })
    expect(onViewer(highlight, at(2), tap(2))).toEqual({ open: null, effects: [] })
  })

  it("closes its note by its X", () => {
    expect(onViewer(highlight, at(2), close).open).toBeNull()
  })

  it("changes nothing for a tap on a note it does not show", () => {
    const open = at(2)
    expect(onViewer(highlight, open, tap(0)).open).toBe(open)
    expect(onViewer(highlight, null, tap(0)).open).toBeNull()
  })

  it("picks out nothing, and can open nothing, when the step highlights no note", () => {
    expect(viewerOf("poem", none, null)).toEqual({
      kind: "marked",
      text: "poem",
      notes: set,
      marked: [],
      open: null,
    })
    expect(onViewer(none, null, tap(2)).open).toBeNull()
  })

  it("is drawn marked in the poem, closed until the reader opens it", () => {
    expect(viewerOf("poem", highlight, null)).toMatchObject({ marked: [2], open: null })
    expect(viewerOf("poem", highlight, at(2))).toMatchObject({ marked: [2], open: 2 })
  })

  it("cannot be deleted: the editor's notes are not the reader's to withdraw", () => {
    const open = at(2)
    expect(onViewer(highlight, open, deleting("2"))).toEqual({ open, effects: [] })
  })
})

describe("the list: the reader's own notes beside the poem, in annotate mode", () => {
  it("opens a tapped note with its id, in place of the one that was open, and closes it when tapped again", () => {
    expect(onViewer(list, null, tap(0)).open).toEqual(at(0, "a"))
    expect(onViewer(list, at(0, "a"), tap(1)).open).toEqual(at(1, "b"))
    expect(onViewer(list, at(1, "b"), tap(1)).open).toBeNull()
  })

  it("has no X: closing changes nothing", () => {
    const open = at(1, "b")
    expect(onViewer(list, open, close).open).toBe(open)
  })

  it("is drawn as a list, with the open note, and can be deleted", () => {
    expect(viewerOf("poem", list, at(1, "b"))).toEqual({
      kind: "listed",
      text: "poem",
      notes: list.set,
      shown: [0, 1, 2],
      open: 1,
      deletable: true,
      recalled: null,
    })
    expect(viewerOf("poem", { ...list, written: null }, null)).toMatchObject({ deletable: false })
  })
})

describe("deleting one of the reader's own notes", () => {
  it("closes the open note and sends out the withdrawal of the note with that id", () => {
    expect(onViewer(list, at(1, "b"), deleting("b"))).toEqual({
      open: null,
      effects: [{ kind: "withdraw", id: "b" }],
    })
  })

  it("changes nothing for an id the list does not carry", () => {
    const open = at(1, "b")
    expect(onViewer(list, open, deleting("z"))).toEqual({ open, effects: [] })
  })
})

describe("keepOpen: the open note, when the commentary is fresh", () => {
  it("follows a note by its id when the notes before it change", () => {
    expect(keepOpen(listOf(["b", "c"]), at(1, "b"))).toEqual(at(0, "b"))
    expect(keepOpen(listOf(["x", "a", "b", "c"]), at(1, "b"))).toEqual(at(2, "b"))
  })

  it("keeps the very same open note when its place has not changed", () => {
    const open = at(1, "b")
    expect(keepOpen(listOf(["a", "b", "c", "d"]), open)).toBe(open)
  })

  it("closes a note that is gone, rather than opening the one now in its place", () => {
    expect(keepOpen(listOf(["a", "c"]), at(1, "b"))).toBeNull()
  })

  it("keeps a note without an id open at its place while that is still shown", () => {
    const open = at(2)
    expect(keepOpen(highlight, open)).toBe(open)
    expect(keepOpen(none, open)).toBeNull()
    expect(keepOpen(highlight, null)).toBeNull()
  })
})
