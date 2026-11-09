import { DISPLAY, LINE, POEM, STANZA } from "../display"
import type {
  LoomAnnotation,
  LoomMetadata,
  LoomPosition,
  LoomTextualComplex,
  LoomUnit,
} from "../types"

/** A small textual complex for tests, shaped as loom writes one: the lines of its stanzas in a
 * substrate, a display schema of one poem, its stanzas and its lines, and one notes set. */
export function makeTextualComplex(
  stanzas: string[][],
  options: { annotations?: LoomAnnotation[]; metadata?: Partial<LoomMetadata> } = {},
): LoomTextualComplex {
  const texts = stanzas.flat()
  const endOf = (line: number): LoomPosition => [line, Array.from(texts[line]).length]

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
        value: null,
        parent: stanzaId,
        start: [line, 0],
        end: endOf(line),
      })
    }
    first = last + 1
  })

  return {
    format: "loom-textual-complex",
    format_version: 1,
    name: "fixture",
    metadata: { title: "Fixture", author: "Anon", ...options.metadata },
    lines: texts.map((text, i) => ({ id: `l${i + 1}`, text })),
    schemata: { display: { kind: DISPLAY, units } },
    atoms: [],
    annotations: { notes: options.annotations ?? [] },
  }
}
