export interface Line {
  id: string
  text: string
}

export interface Stanza {
  lines: Line[]
}

export interface Poem {
  title: string
  poet: string
  year?: number
  stanzas: Stanza[]
}

export type ReaderText = Poem

interface Position {
  line: string
  offset: number
}

interface Span {
  start: Position
  end: Position
}

interface Annotation {
  id: string
  targets: Span[]
  body: string
}
