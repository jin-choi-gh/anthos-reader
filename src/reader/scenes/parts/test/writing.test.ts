import { describe, expect, it } from "vitest"
import type { Fingerprint, Span, Substrate } from "../../../../material/types"
import type { NoteId, ReaderNote } from "../../../../notebook/types"
import type { PracticeFingerprint } from "../../../../practice/types"
import type { WritingSubject } from "../../types"
import {
  choosingOf,
  keepWriting,
  onChoose,
  onPassages,
  onPraxisBar,
  startWriting,
  writingOf,
  type WritingState,
} from "../writing"

/** Lines of the substrate, each with the id loom would give it: "l1", "l2", and on. */
const withIds = (texts: readonly string[]) => texts.map((text, i) => ({ id: `l${i + 1}`, text }))

const targets: readonly Span[] = [{ start: { line: 0, offset: 0 }, end: { line: 1, offset: 30 } }]
const saved: ReaderNote = {
  id: "n" as NoteId,
  targets,
  tags: [],
  fingerprint: "f" as Fingerprint,
  body: "Worms.",
  from: {
    practice: "test",
    fingerprint: "0123456789abcd" as PracticeFingerprint,
    stage: 0,
    step: 1,
  },
  writtenAt: 0,
  revisedAt: null,
}

/** A page with nothing written yet, and one with a note written. */
const blank: WritingSubject = {
  about: { kind: "fixed", targets },
  tags: [],
  count: "one",
  written: [],
}
const filled: WritingSubject = {
  about: { kind: "fixed", targets },
  tags: [],
  count: "one",
  written: [saved],
}

const draft = (text: string) => ({ kind: "draft", text }) as const
const submit = { kind: "submit" } as const
const edit = { kind: "edit" } as const
const cancel = { kind: "cancel" } as const

describe("a blank page", () => {
  const start = startWriting(blank)

  it("opens for writing, empty, with Respond not yet pressable and no Cancel", () => {
    expect(start).toEqual({ editing: true, draft: "", passages: null })
    expect(writingOf(blank, start)).toEqual({
      kind: "writing",
      draft: "",
      canSubmit: false,
      canCancel: false,
      passages: null,
    })
  })

  it("keeps what the reader types, and lets them respond once it says something", () => {
    const { state, effects } = onPraxisBar(blank, start, draft("Worms. "))
    expect(state).toEqual({ editing: true, draft: "Worms. ", passages: null })
    expect(effects).toEqual([])
    expect(writingOf(blank, state)).toMatchObject({ canSubmit: true })
    expect(writingOf(blank, { editing: true, draft: "   ", passages: null })).toMatchObject({
      canSubmit: false,
    })
  })

  it("Respond writes a new note on the whole poem, trimmed, and shows it as written", () => {
    const typed = { editing: true, draft: "  Worms. ", passages: null }
    const { state, effects } = onPraxisBar(blank, typed, submit)
    expect(effects).toEqual([{ kind: "note", targets, tags: [], body: "Worms." }])
    expect(state).toEqual({ editing: false, draft: "Worms.", passages: null })
    expect(writingOf(blank, state)).toEqual({ kind: "written", body: "Worms.", lemma: null })
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
    expect(start).toEqual({ editing: false, draft: "Worms.", passages: null })
    expect(writingOf(filled, start)).toEqual({ kind: "written", body: "Worms.", lemma: null })
  })

  it("Edit opens the page again with the note in the box, Respond not pressable until it changes", () => {
    const { state } = onPraxisBar(filled, start, edit)
    expect(state).toEqual({ editing: true, draft: "Worms.", passages: null })
    expect(writingOf(filled, state)).toEqual({
      kind: "writing",
      draft: "Worms.",
      canSubmit: false,
      canCancel: true,
      passages: null,
    })
  })

  it("Respond after an edit revises the same note", () => {
    const typed = { editing: true, draft: "Worms, raw.", passages: null }
    expect(onPraxisBar(filled, typed, submit).effects).toEqual([
      { kind: "revise", id: "n", targets, body: "Worms, raw." },
    ])
  })

  it("Cancel goes back to the note as written, and writes nothing", () => {
    const typed = { editing: true, draft: "Something else.", passages: null }
    expect(onPraxisBar(filled, typed, cancel)).toEqual({
      state: { editing: false, draft: "Worms.", passages: null },
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
    expect(
      keepWriting(filled, revised, { editing: false, draft: "Worms.", passages: null }),
    ).toEqual({
      editing: false,
      draft: "Worms, raw.",
      passages: null,
    })
    const writing = { editing: true, draft: "Half a thought", passages: null }
    expect(keepWriting(filled, revised, writing)).toBe(writing)
  })

  it("keeps the very same state when nothing changed", () => {
    const shown = { editing: false, draft: "Worms.", passages: null }
    expect(keepWriting(filled, filled, shown)).toBe(shown)
  })

  it("leaves a blank page again when the note is gone, forgotten or withdrawn", () => {
    expect(keepWriting(filled, blank, { editing: false, draft: "Worms.", passages: null })).toEqual(
      {
        editing: true,
        draft: "",
        passages: null,
      },
    )
  })

  it("keeps what was just sent while the notebook has not yet taken it", () => {
    const sent = { editing: false, draft: "Worms.", passages: null }
    expect(keepWriting(blank, blank, sent)).toBe(sent)
  })

  it("leaves what the reader has typed alone, whatever arrives", () => {
    const typing = { editing: true, draft: "Half a thought", passages: null }
    expect(keepWriting(blank, filled, typing)).toBe(typing)
    const editing = { editing: true, draft: "Worms, and more", passages: null }
    expect(keepWriting(filled, blank, editing)).toBe(editing)
  })

  it("shows a note that arrives on a blank page, as written in another tab", () => {
    expect(keepWriting(blank, filled, { editing: true, draft: "", passages: null })).toEqual({
      editing: false,
      draft: "Worms.",
      passages: null,
    })
  })

  it("follows a revision made elsewhere while the note is open and untouched", () => {
    const revised = { ...filled, written: [{ ...saved, body: "Worms, raw." }] }
    expect(
      keepWriting(filled, revised, { editing: true, draft: "Worms.", passages: null }),
    ).toEqual({
      editing: true,
      draft: "Worms, raw.",
      passages: null,
    })
  })

  it("leaves a blank page when the note is gone while it is open and untouched", () => {
    expect(keepWriting(filled, blank, { editing: true, draft: "Worms.", passages: null })).toEqual({
      editing: true,
      draft: "",
      passages: null,
    })
  })

  it("keeps the very same state for an untouched page when nothing changed", () => {
    const empty = { editing: true, draft: "", passages: null }
    expect(keepWriting(blank, blank, empty)).toBe(empty)
    const open = { editing: true, draft: "Worms.", passages: null }
    expect(keepWriting(filled, filled, open)).toBe(open)
  })
})

// A note on passages the reader chooses, as a step's writing on chosen passages asks for

const lines: Substrate = {
  lines: withIds([
    "A Bird, came down the Walk -",
    "He did not know I saw -",
    "He bit an Angle Worm in halves",
  ]),
}
const span = (
  startLine: number,
  startOffset: number,
  endLine: number,
  endOffset: number,
): Span => ({
  start: { line: startLine, offset: startOffset },
  end: { line: endLine, offset: endOffset },
})
const poem = span(0, 0, 2, 30)
const bird = span(0, 2, 0, 6)
const worm = span(2, 10, 2, 20)
const observed: ReaderNote = { ...saved, id: "o" as NoteId, targets: [bird], body: "A bird." }

/** A page on passages the reader chooses, blank or with a note written. */
const choosing: WritingSubject = {
  about: { kind: "chosen", substrate: lines },
  tags: [],
  count: "one",
  written: [],
}
const chose: WritingSubject = { ...choosing, written: [observed] }

const on = { kind: "choosing", on: true } as const

/** A page open for writing, with passages chosen and words typed. */
const writing = (targets: readonly Span[], text: string, open = false): WritingState => ({
  editing: true,
  draft: text,
  passages: { choosing: open, targets },
})

/** The page with a note written, opened again with Edit. */
const reopened = () => onPraxisBar(chose, startWriting(chose), edit).state

describe("a page on passages the reader chooses", () => {
  it("opens blank for writing, with choosing off and nothing chosen", () => {
    const start = startWriting(choosing)
    expect(start).toEqual({ editing: true, draft: "", passages: { choosing: false, targets: [] } })
    expect(writingOf(choosing, start)).toEqual({
      kind: "writing",
      draft: "",
      canSubmit: false,
      canCancel: false,
      passages: { choosing: false, chosen: [] },
    })
  })

  it("chooses passages once choosing is on, and draws each one's lemma", () => {
    const start = startWriting(choosing)
    expect(onChoose(choosing, start, bird)).toBe(start)
    let state = onPassages(start, on)
    state = onChoose(choosing, onChoose(choosing, state, worm), bird)
    expect(state.passages?.targets).toEqual([bird, worm])
    expect(writingOf(choosing, state)).toMatchObject({
      passages: {
        choosing: true,
        chosen: [
          { kind: "quote", text: "Bird" },
          { kind: "quote", text: "Angle Worm" },
        ],
      },
    })
    expect(choosingOf(state)).toEqual({ choosing: true, targets: [bird, worm] })
  })

  it("Respond writes a new note on the passages chosen, then shows it with its lemma", () => {
    const { state, effects } = onPraxisBar(choosing, writing([bird, worm], " Fed. ", true), submit)
    expect(effects).toEqual([{ kind: "note", targets: [bird, worm], tags: [], body: "Fed." }])
    expect(state).toEqual({
      editing: false,
      draft: "Fed.",
      passages: { choosing: false, targets: [bird, worm] },
    })
    expect(writingOf(choosing, state)).toEqual({
      kind: "written",
      body: "Fed.",
      lemma: [
        { kind: "quote", text: "Bird" },
        { kind: "quote", text: "Angle Worm" },
      ],
    })
    expect(choosingOf(state)).toBeNull()
  })

  it("Respond with no passage chosen writes a note on the whole poem", () => {
    const { state, effects } = onPraxisBar(choosing, writing([], "All of it."), submit)
    expect(effects).toEqual([{ kind: "note", targets: [poem], tags: [], body: "All of it." }])
    expect(writingOf(choosing, state)).toMatchObject({
      lemma: [{ kind: "citation", text: "the whole poem" }],
    })
  })

  it("Edit brings back the note's passages and words, with choosing off", () => {
    const start = startWriting(chose)
    expect(start).toEqual({
      editing: false,
      draft: "A bird.",
      passages: { choosing: false, targets: [bird] },
    })
    const state = reopened()
    expect(state).toEqual({
      editing: true,
      draft: "A bird.",
      passages: { choosing: false, targets: [bird] },
    })
    expect(writingOf(chose, state)).toMatchObject({ canSubmit: false, canCancel: true })
  })

  it("Respond after changing only the passages revises the note, with its new targets", () => {
    const added = onChoose(chose, onPassages(reopened(), on), worm)
    expect(writingOf(chose, added)).toMatchObject({ canSubmit: true })
    expect(onPraxisBar(chose, added, submit).effects).toEqual([
      { kind: "revise", id: "o", targets: [bird, worm], body: "A bird." },
    ])
    const removed = onPassages(reopened(), { kind: "unchoose", index: 0 })
    expect(onPraxisBar(chose, removed, submit).effects).toEqual([
      { kind: "revise", id: "o", targets: [poem], body: "A bird." },
    ])
  })

  it("a note on the whole poem comes back with nothing chosen, and unchanged cannot be sent", () => {
    const all: WritingSubject = { ...choosing, written: [{ ...observed, targets: [poem] }] }
    const { state } = onPraxisBar(all, startWriting(all), edit)
    expect(state.passages).toEqual({ choosing: false, targets: [] })
    expect(writingOf(all, state)).toMatchObject({ canSubmit: false })
    const typed = onPraxisBar(all, state, draft("All of it, again.")).state
    expect(onPraxisBar(all, typed, submit).effects).toEqual([
      { kind: "revise", id: "o", targets: [poem], body: "All of it, again." },
    ])
  })

  it("Cancel goes back to the note as written, passages and all", () => {
    const changed = writing([bird, worm], "Something else.", true)
    expect(onPraxisBar(chose, changed, cancel)).toEqual({
      state: { editing: false, draft: "A bird.", passages: { choosing: false, targets: [bird] } },
      effects: [],
    })
  })

  it("ignores passages while the note is only shown, and on a page about the whole poem", () => {
    const shown = startWriting(chose)
    expect(onPassages(shown, on)).toBe(shown)
    const shownChoosing = { ...shown, passages: { choosing: true, targets: [bird] } }
    expect(onChoose(chose, shownChoosing, worm)).toBe(shownChoosing)
    const whole = startWriting(blank)
    expect(onPassages(whole, on)).toBe(whole)
    expect(onChoose(blank, whole, bird)).toBe(whole)
    expect(choosingOf(whole)).toBeNull()
  })
})

describe("keepWriting: a page on passages the reader chooses, when the notebook changes", () => {
  it("leaves passages the reader has chosen alone, as their own", () => {
    const revised = { ...chose, written: [{ ...observed, body: "A bird, revised." }] }
    const mine = writing([bird, worm], "A bird.")
    expect(keepWriting(chose, revised, mine)).toBe(mine)
  })

  it("follows a revision made elsewhere, passages and all, while the page is untouched", () => {
    const revised = { ...chose, written: [{ ...observed, targets: [worm], body: "A worm." }] }
    expect(keepWriting(chose, revised, writing([bird], "A bird.", true))).toEqual(
      writing([worm], "A worm.", true),
    )
    expect(keepWriting(chose, revised, startWriting(chose))).toEqual({
      editing: false,
      draft: "A worm.",
      passages: { choosing: false, targets: [worm] },
    })
  })

  it("keeps what was just sent when the notebook gives it back", () => {
    const sent = onPraxisBar(choosing, writing([bird, worm], "Fed.", true), submit).state
    const back = { ...choosing, written: [{ ...observed, targets: [bird, worm], body: "Fed." }] }
    expect(keepWriting(choosing, back, sent)).toBe(sent)
    const all = onPraxisBar(choosing, writing([], "All of it."), submit).state
    const allBack = { ...choosing, written: [{ ...observed, targets: [poem], body: "All of it." }] }
    expect(keepWriting(choosing, allBack, all)).toBe(all)
  })
})
