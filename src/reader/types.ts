// What the reader draws, made from a loom version by loom/toPoem.ts. Positions, spans and units stay
// in loom's own types (loom/types.ts); nothing here restates them.

export interface Line {
  id: string // the display schema's line unit
  text: string // cut from the substrate by the unit's span
  number: number // the line's place in the substrate, from 1
}

export interface Stanza {
  lines: Line[]
}

export interface Poem {
  title: string
  author: string
  year?: number
  stanzas: Stanza[]
}
