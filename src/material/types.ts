/** A text's id: its file in text-data/, "dickinson". */
export type TextId = string

/** The poem's lines, as loom keeps them: every line of the text, in order, from 0. */
export interface Substrate {
  readonly lines: readonly string[]
}

/** A place in the poem: a line of the substrate, from 0, and an offset in that line, in code points. */
export interface Position {
  readonly line: number
  readonly offset: number
}

/** A stretch of the poem, from `start` up to, not including, `end`. */
export interface Span {
  readonly start: Position
  readonly end: Position
}

/** A note on the poem, as loom has one: what it is about, its tags, and what it says. `id` is the
 * editor's name for it ("angle-worm"), or null. */
export interface Annotation {
  readonly id: string | null
  readonly targets: readonly Span[]
  readonly tags: readonly string[]
  readonly body: string
}

/** A hash of a substrate's lines: the same lines always give the same fingerprint, and changed lines
 * almost surely another. Only fingerprintOf makes one. */
export type Fingerprint = string & { readonly __brand: "Fingerprint" }

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

/** A stretch of one line that one note covers: a target clipped to that line, by offsets in code
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
