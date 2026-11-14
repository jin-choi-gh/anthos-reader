import { textOf } from "../material/spans"
import type { Line, Poem, Stanza } from "../material/types"
import { DISPLAY, LINE, POEM, STANZA } from "./display"
import type { LoomUnit, LoomTextualComplex } from "./types"
import { SchemaTree, schemaOfKind, spanOf, substrateOf } from "./textualComplex"

/** The poem from a loom textual complex: the poems, stanzas and lines of its display
 * schema, each line's text cut from the substrate by its span, and the textual complex's
 * metadata. */
export function toPoem(textualComplex: LoomTextualComplex): Poem {
  const substrate = substrateOf(textualComplex)
  const tree = new SchemaTree(schemaOfKind(textualComplex, DISPLAY).schema)
  const ranked = (units: LoomUnit[], rank: string) => units.filter((unit) => unit.rank === rank)

  const stanzas: Stanza[] = ranked(tree.roots(), POEM).flatMap((poem) =>
    ranked(tree.children(poem), STANZA).map((stanza) => ({
      lines: ranked(tree.children(stanza), LINE).map((line): Line => ({
        id: line.id,
        text: textOf(substrate, spanOf(line)),
        indexInSubstrate: line.start[0],
        number: line.start[0] + 1,
        indent: indentOf(textualComplex, line),
      })),
    })),
  )

  return {
    title: textualComplex.metadata.title ?? textualComplex.name ?? "Untitled",
    author: textualComplex.metadata.author ?? "",
    stanzas,
  }
}

function indentOf(textualComplex: LoomTextualComplex, line: LoomUnit): number {
  const value = line.value ?? "0"
  if (!/^\d+$/.test(value)) {
    throw new Error(
      `${textualComplex.name}: line ${line.id} has indent ${JSON.stringify(line.value)}, not a whole number`,
    )
  }
  return Number(value)
}
