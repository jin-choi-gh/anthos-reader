// The material: a text as made from a loom textual complex by loom/toPoem.ts and loom/toNotes.ts.
// Practices refer to its notes, and the reader draws it; it knows neither.

export interface Line {
  id: string // the display schema's line unit
  text: string // cut from the substrate by the unit's span
  indexInSubstrate: number // the line's place in the substrate, from 0, as loom's positions count
  number: number // the line's number, from 1, as printed beside it
  indent: number // the line's indent level, from 0, as loom's display schema gives it
}

export interface Stanza {
  lines: Line[]
}

export interface Poem {
  title: string
  author: string
  stanzas: Stanza[]
}

/** One target's part of a lemma: the poem's own words, or a citation such as "lines 1–4". */
export interface LemmaPart {
  kind: "quote" | "citation"
  text: string
}

export interface Note {
  index: number
  loomId: string | null
  lemma: LemmaPart[]
  tags: string[]
  paragraphs: string[]
}

/** A stretch of one line that one note covers: a loom span clipped to that line, by offsets in code
 * points. The range does not name its line: it is one of the ranges rangesOn gives for that line. */
export interface NoteRange {
  start: number
  end: number
  noteIndex: number
}

export interface Notes {
  notes: Note[] // every note, in file order
  rangesOn(indexInSubstrate: number): NoteRange[] // the ranges on one line
}
