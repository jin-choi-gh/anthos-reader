import { DISPLAY, LINE, POEM, STANZA } from "../display"
import { WORD, WORD_TOKENS } from "../toWords"
import type {
  LoomAnnotation,
  LoomMetadata,
  LoomPosition,
  LoomTextualComplex,
  LoomUnit,
} from "../types"

/** A small textual complex for tests, shaped as loom writes one: the lines of its stanzas in a
 * substrate, a display schema of one poem, its stanzas and its lines, and one notes set. As in
 * loom's display.txt, a line's leading tabs are its indent: "\tHe did not know" is indented once,
 * and its line unit's value is "1". Its word-tokens schema finds the words as loom finds them: runs
 * of letters, digits and marks, with apostrophes inside. */
export function makeTextualComplex(
  stanzas: string[][],
  options: { annotations?: LoomAnnotation[]; metadata?: Partial<LoomMetadata> } = {},
): LoomTextualComplex {
  const rows = stanzas.flat()
  const texts = rows.map((row) => row.replace(/^\t+/, ""))
  const indentOf = (line: number) => String(rows[line]!.length - texts[line]!.length)
  const endOf = (line: number): LoomPosition => [line, Array.from(texts[line]!).length]

  const units: LoomUnit[] = [
    {
      id: "poem",
      rank: POEM,
      value: null,
      parent: null,
      start: [0, 0],
      end: endOf(texts.length - 1),
    },
  ]
  let first = 0
  stanzas.forEach((stanza, s) => {
    const last = first + stanza.length - 1
    const stanzaId = `stanza${s + 1}`
    units.push({
      id: stanzaId,
      rank: STANZA,
      value: null,
      parent: "poem",
      start: [first, 0],
      end: endOf(last),
    })
    for (let line = first; line <= last; line++) {
      units.push({
        id: `line${line + 1}`,
        rank: LINE,
        value: indentOf(line),
        parent: stanzaId,
        start: [line, 0],
        end: endOf(line),
      })
    }
    first = last + 1
  })

  const words: LoomUnit[] = texts.flatMap((text, line) => {
    const found: LoomUnit[] = []
    for (const match of text.matchAll(/[\p{L}\p{N}\p{M}]+(?:['’][\p{L}\p{N}\p{M}]+)*/gu)) {
      // Offsets in code points, as loom counts them
      const start = Array.from(text.slice(0, match.index)).length
      const end = start + Array.from(match[0]).length
      found.push({
        id: `l${line + 1}.w${found.length + 1}`,
        rank: WORD,
        value: null,
        parent: null,
        start: [line, start],
        end: [line, end],
      })
    }
    return found
  })

  return {
    format: "loom-textual-complex",
    format_version: 1,
    name: "fixture",
    metadata: { title: "Fixture", author: "Anon", ...options.metadata },
    lines: texts.map((text, i) => ({ id: `l${i + 1}`, text })),
    schemata: {
      display: { kind: DISPLAY, units },
      "word-tokens": { kind: WORD_TOKENS, units: words },
    },
    atoms: [],
    annotations: { notes: options.annotations ?? [] },
  }
}
