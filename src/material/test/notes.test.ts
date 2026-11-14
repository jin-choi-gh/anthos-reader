import { describe, expect, it } from "vitest"
import { editorsNotes, lemmaOf } from "../notes"
import { wholePoem } from "../spans"
import type { Annotation, Span, Substrate } from "../types"

const substrate: Substrate = {
  lines: [
    "A Bird, came down the Walk -",
    "He did not know I saw -",
    "He bit an Angle Worm in halves",
  ],
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

const annotation = (targets: Span[], more: Partial<Annotation> = {}): Annotation => ({
  id: null,
  targets,
  tags: [],
  body: "A note.",
  ...more,
})

/** The editor's notes from one annotation per list of targets. */
function notesOn(...targetLists: Span[][]) {
  return editorsNotes(
    substrate,
    targetLists.map((targets) => annotation(targets)),
  )
}

describe("editorsNotes: lemmas", () => {
  it("cites the whole poem", () => {
    const { notes } = notesOn([span(0, 0, 2, 30)])
    expect(notes[0]!.lemma).toEqual([{ kind: "citation", text: "the whole poem" }])
  })

  it("cites whole lines by number", () => {
    const { notes } = notesOn([span(1, 0, 1, 23)], [span(0, 0, 1, 23)])
    expect(notes[0]!.lemma).toEqual([{ kind: "citation", text: "line 2" }])
    expect(notes[1]!.lemma).toEqual([{ kind: "citation", text: "lines 1–2" }])
  })

  it("quotes a passage, with / at line breaks and … for the lines between", () => {
    const { notes } = notesOn([span(2, 10, 2, 20)], [span(0, 22, 1, 6)], [span(0, 22, 2, 6)])
    expect(notes.map((note) => note.lemma[0]!.text)).toEqual([
      "Angle Worm",
      "Walk - / He did",
      "Walk - / … / He bit",
    ])
    expect(notes[0]!.lemma[0]!.kind).toBe("quote")
  })

  it("gives a part for each target, in order", () => {
    const { notes } = notesOn([span(2, 10, 2, 15), span(1, 0, 1, 23)])
    expect(notes[0]!.lemma).toEqual([
      { kind: "quote", text: "Angle" },
      { kind: "citation", text: "line 2" },
    ])
  })

  it("cites the whole poem when lines with no text lie at either end", () => {
    const edged = { lines: ["", ...substrate.lines, ""] }
    expect(lemmaOf(edged, [span(1, 0, 3, 30)])).toEqual([
      { kind: "citation", text: "the whole poem" },
    ])
  })

  it("cites a reader's note on the whole poem as the editor's", () => {
    expect(lemmaOf(substrate, [wholePoem(substrate)])).toEqual([
      { kind: "citation", text: "the whole poem" },
    ])
  })
})

describe("editorsNotes: indexes, ids, tags and paragraphs", () => {
  const target = span(2, 10, 2, 15)

  it("numbers notes in the order given, from 0, and keeps each id", () => {
    const { notes } = editorsNotes(substrate, [
      annotation([target], { id: "angle-worm" }),
      annotation([target]),
    ])
    expect(notes.map((note) => [note.index, note.loomId])).toEqual([
      [0, "angle-worm"],
      [1, null],
    ])
  })

  it("keeps a note's tags, in the editor's order", () => {
    const { notes } = editorsNotes(substrate, [
      annotation([target], { tags: ["gloss", "comment"] }),
      annotation([target]),
    ])
    expect(notes.map((note) => note.tags)).toEqual([["gloss", "comment"], []])
  })

  it("splits a body at blank lines and joins each paragraph's wrapped lines", () => {
    const { notes } = editorsNotes(substrate, [
      annotation([target], { body: "Like a hardened\ncriminal.\n\n  The bird\n" }),
    ])
    expect(notes[0]!.paragraphs).toEqual(["Like a hardened criminal.", "The bird"])
  })
})

describe("editorsNotes: ranges on lines", () => {
  it("cuts a passage at the line breaks it crosses", () => {
    const { rangesOn } = notesOn([span(0, 22, 2, 6)])
    expect(rangesOn(0)).toEqual([{ start: 22, end: 28, noteIndex: 0 }])
    expect(rangesOn(1)).toEqual([{ start: 0, end: 23, noteIndex: 0 }])
    expect(rangesOn(2)).toEqual([{ start: 0, end: 6, noteIndex: 0 }])
  })

  it("marks nothing for a whole-poem note", () => {
    const { rangesOn } = notesOn([span(0, 0, 2, 30)])
    expect([0, 1, 2].map(rangesOn)).toEqual([[], [], []])
  })

  it("gives no ranges for a line beyond the poem", () => {
    expect(notesOn().rangesOn(99)).toEqual([])
  })
})
