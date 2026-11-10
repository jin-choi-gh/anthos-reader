import { describe, expect, it } from "vitest"
import { makeTextualComplex } from "./fixture"
import { toNotes } from "../toNotes"
import type { LoomSpan } from "../types"

const stanzas = [
  ["A Bird, came down the Walk -", "He did not know I saw -", "He bit an Angle Worm in halves"],
]

/** The notes of a textual complex whose one notes set has an annotation per list of targets. */
function notesOn(...targetLists: LoomSpan[][]) {
  return toNotes(
    makeTextualComplex(stanzas, {
      annotations: targetLists.map((targets) => ({ targets, body: "A note." })),
    }),
  )
}

describe("toNotes: lemmas", () => {
  it("cites the whole poem", () => {
    const { notes } = notesOn([{ start: [0, 0], end: [2, 30] }])
    expect(notes[0].lemma).toEqual([{ kind: "citation", text: "the whole poem" }])
  })

  it("cites whole lines by number", () => {
    const { notes } = notesOn([{ start: [1, 0], end: [1, 23] }], [{ start: [0, 0], end: [1, 23] }])
    expect(notes[0].lemma).toEqual([{ kind: "citation", text: "line 2" }])
    expect(notes[1].lemma).toEqual([{ kind: "citation", text: "lines 1–2" }])
  })

  it("quotes a passage, with / at line breaks and … for the lines between", () => {
    const { notes } = notesOn(
      [{ start: [2, 10], end: [2, 20] }],
      [{ start: [0, 22], end: [1, 6] }],
      [{ start: [0, 22], end: [2, 6] }],
    )
    expect(notes.map((note) => note.lemma[0].text)).toEqual([
      "Angle Worm",
      "Walk - / He did",
      "Walk - / … / He bit",
    ])
    expect(notes[0].lemma[0].kind).toBe("quote")
  })

  it("gives a part for each target, in order", () => {
    const { notes } = notesOn([
      { start: [2, 10], end: [2, 15] },
      { start: [1, 0], end: [1, 23] },
    ])
    expect(notes[0].lemma).toEqual([
      { kind: "quote", text: "Angle" },
      { kind: "citation", text: "line 2" },
    ])
  })
})

describe("toNotes: indexes, ids and paragraphs", () => {
  const target = { start: [2, 10], end: [2, 15] } as const satisfies LoomSpan

  it("numbers notes in file order, from 0, across every set", () => {
    const complex = makeTextualComplex(stanzas, {
      annotations: [
        { targets: [target], body: "A note." },
        { targets: [target], body: "Another." },
      ],
    })
    complex.annotations["notes-fear"] = [{ targets: [target], body: "In another set." }]
    expect(toNotes(complex).notes.map((note) => note.index)).toEqual([0, 1, 2])
  })

  it("keeps a note's loom id, and gives null to a note without one", () => {
    const complex = makeTextualComplex(stanzas, {
      annotations: [
        { id: "angle-worm", targets: [target], body: "Named." },
        { id: null, targets: [target], body: "Unnamed." },
        { targets: [target], body: "From a file written before ids." },
      ],
    })
    expect(toNotes(complex).notes.map((note) => note.loomId)).toEqual(["angle-worm", null, null])
  })

  it("splits a body at blank lines and joins each paragraph's wrapped lines", () => {
    const complex = makeTextualComplex(stanzas, {
      annotations: [
        {
          targets: [{ start: [2, 10], end: [2, 15] }],
          body: "Like a hardened\ncriminal.\n\n  The bird\n",
        },
      ],
    })
    expect(toNotes(complex).notes[0].paragraphs).toEqual(["Like a hardened criminal.", "The bird"])
  })
})

describe("toNotes: tags", () => {
  const target = { start: [2, 10], end: [2, 15] } as const satisfies LoomSpan

  it("keeps a note's tags, in the editor's order", () => {
    const complex = makeTextualComplex(stanzas, {
      annotations: [
        { targets: [target], tags: ["gloss", "comment"], body: "A note." },
        { targets: [target], tags: [], body: "An untagged note." },
      ],
    })
    expect(toNotes(complex).notes.map((note) => note.tags)).toEqual([["gloss", "comment"], []])
  })

  it("gives no tags to a note from a file written before tags", () => {
    const complex = makeTextualComplex(stanzas, {
      annotations: [{ targets: [target], body: "A note." }],
    })
    expect(toNotes(complex).notes[0].tags).toEqual([])
  })
})

describe("toNotes: ranges on lines", () => {
  it("cuts a passage at the line breaks it crosses", () => {
    const { rangesOn } = notesOn([{ start: [0, 22], end: [2, 6] }])
    expect(rangesOn(0)).toEqual([{ start: 22, end: 28, noteIndex: 0 }])
    expect(rangesOn(1)).toEqual([{ start: 0, end: 23, noteIndex: 0 }])
    expect(rangesOn(2)).toEqual([{ start: 0, end: 6, noteIndex: 0 }])
  })

  it("marks nothing for a whole-poem note", () => {
    const { rangesOn } = notesOn([{ start: [0, 0], end: [2, 30] }])
    expect([0, 1, 2].map(rangesOn)).toEqual([[], [], []])
  })

  it("gives no ranges for a line beyond the poem", () => {
    expect(notesOn().rangesOn(99)).toEqual([])
  })
})
