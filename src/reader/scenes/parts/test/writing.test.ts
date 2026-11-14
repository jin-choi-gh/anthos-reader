import { describe, expect, it } from "vitest"
import type { NoteId, ReaderNote } from "../../../../notebook/types"
import type { WritingSubject } from "../../types"
import { keepWriting, onPraxisBar, startWriting, writingOf } from "../writing"

const anchor = { kind: "whole", text: "poem" } as const
const saved: ReaderNote = {
  id: "n" as NoteId,
  anchor,
  body: "Worms.",
  from: { practice: "test", stage: 0, step: 1 },
  writtenAt: 0,
  revisedAt: null,
}

/** A page with nothing written yet, and one with a note written. */
const blank: WritingSubject = { anchor, count: "one", written: [] }
const filled: WritingSubject = { anchor, count: "one", written: [saved] }

const draft = (text: string) => ({ kind: "draft", text }) as const
const submit = { kind: "submit" } as const
const edit = { kind: "edit" } as const
const cancel = { kind: "cancel" } as const

describe("a blank page", () => {
  const start = startWriting(blank)

  it("opens for writing, empty, with Respond not yet pressable and no Cancel", () => {
    expect(start).toEqual({ editing: true, draft: "" })
    expect(writingOf(blank, start)).toEqual({
      kind: "writing",
      draft: "",
      canSubmit: false,
      canCancel: false,
    })
  })

  it("keeps what the reader types, and lets them respond once it says something", () => {
    const { state, effects } = onPraxisBar(blank, start, draft("Worms. "))
    expect(state).toEqual({ editing: true, draft: "Worms. " })
    expect(effects).toEqual([])
    expect(writingOf(blank, state)).toMatchObject({ canSubmit: true })
    expect(writingOf(blank, { editing: true, draft: "   " })).toMatchObject({ canSubmit: false })
  })

  it("Respond writes a new note on the whole poem, trimmed, and shows it as written", () => {
    const typed = { editing: true, draft: "  Worms. " }
    const { state, effects } = onPraxisBar(blank, typed, submit)
    expect(effects).toEqual([{ kind: "note", anchor, body: "Worms." }])
    expect(state).toEqual({ editing: false, draft: "Worms." })
    expect(writingOf(blank, state)).toEqual({ kind: "written", body: "Worms." })
  })

  it("Respond on an empty page writes nothing", () => {
    expect(onPraxisBar(blank, start, submit)).toEqual({ state: start, effects: [] })
  })

  it("has nothing to edit or cancel", () => {
    expect(onPraxisBar(blank, start, edit).state).toBe(start)
    expect(onPraxisBar(blank, start, cancel).state).toBe(start)
  })
})

describe("a page with a note written", () => {
  const start = startWriting(filled)

  it("shows the note, with Edit", () => {
    expect(start).toEqual({ editing: false, draft: "Worms." })
    expect(writingOf(filled, start)).toEqual({ kind: "written", body: "Worms." })
  })

  it("Edit opens the page again with the note in the box, Respond not pressable until it changes", () => {
    const { state } = onPraxisBar(filled, start, edit)
    expect(state).toEqual({ editing: true, draft: "Worms." })
    expect(writingOf(filled, state)).toEqual({
      kind: "writing",
      draft: "Worms.",
      canSubmit: false,
      canCancel: true,
    })
  })

  it("Respond after an edit revises the same note", () => {
    const typed = { editing: true, draft: "Worms, raw." }
    expect(onPraxisBar(filled, typed, submit).effects).toEqual([
      { kind: "revise", id: "n", body: "Worms, raw." },
    ])
  })

  it("Cancel goes back to the note as written, and writes nothing", () => {
    const typed = { editing: true, draft: "Something else." }
    expect(onPraxisBar(filled, typed, cancel)).toEqual({
      state: { editing: false, draft: "Worms." },
      effects: [],
    })
  })

  it("ignores typing while the note is only shown", () => {
    expect(onPraxisBar(filled, start, draft("Sneaked in.")).state).toBe(start)
  })
})

describe("keepWriting: the page, when the notebook changes", () => {
  it("shows the note as it now stands, unless the reader is writing", () => {
    const revised = { ...filled, written: [{ ...saved, body: "Worms, raw." }] }
    expect(keepWriting(filled, revised, { editing: false, draft: "Worms." })).toEqual({
      editing: false,
      draft: "Worms, raw.",
    })
    const writing = { editing: true, draft: "Half a thought" }
    expect(keepWriting(filled, revised, writing)).toBe(writing)
  })

  it("keeps the very same state when nothing changed", () => {
    const shown = { editing: false, draft: "Worms." }
    expect(keepWriting(filled, filled, shown)).toBe(shown)
  })

  it("leaves a blank page again when the note is gone, forgotten or withdrawn", () => {
    expect(keepWriting(filled, blank, { editing: false, draft: "Worms." })).toEqual({
      editing: true,
      draft: "",
    })
  })

  it("keeps what was just sent while the notebook has not yet taken it", () => {
    const sent = { editing: false, draft: "Worms." }
    expect(keepWriting(blank, blank, sent)).toBe(sent)
  })

  it("leaves what the reader has typed alone, whatever arrives", () => {
    const typing = { editing: true, draft: "Half a thought" }
    expect(keepWriting(blank, filled, typing)).toBe(typing)
    const editing = { editing: true, draft: "Worms, and more" }
    expect(keepWriting(filled, blank, editing)).toBe(editing)
  })

  it("shows a note that arrives on a blank page, as written in another tab", () => {
    expect(keepWriting(blank, filled, { editing: true, draft: "" })).toEqual({
      editing: false,
      draft: "Worms.",
    })
  })

  it("follows a revision made elsewhere while the note is open and untouched", () => {
    const revised = { ...filled, written: [{ ...saved, body: "Worms, raw." }] }
    expect(keepWriting(filled, revised, { editing: true, draft: "Worms." })).toEqual({
      editing: true,
      draft: "Worms, raw.",
    })
  })

  it("leaves a blank page when the note is gone while it is open and untouched", () => {
    expect(keepWriting(filled, blank, { editing: true, draft: "Worms." })).toEqual({
      editing: true,
      draft: "",
    })
  })

  it("keeps the very same state for an untouched page when nothing changed", () => {
    const empty = { editing: true, draft: "" }
    expect(keepWriting(blank, blank, empty)).toBe(empty)
    const open = { editing: true, draft: "Worms." }
    expect(keepWriting(filled, filled, open)).toBe(open)
  })
})
