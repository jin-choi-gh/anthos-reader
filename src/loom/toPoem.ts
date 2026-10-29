import type { Line, Poem, Stanza } from "../reader/types"
import { DISPLAY, LINE, POEM, STANZA } from "./display"
import type { LoomUnit, LoomVersion } from "./types"
import { SchemaTree, schemaOfKind, textOf } from "./version"

/** The reader's Poem from a loom version: the poems, stanzas and lines of its display schema, each
 * line's text cut from the substrate by its span, and the version's metadata. */
export function toPoem(version: LoomVersion): Poem {
  const tree = new SchemaTree(schemaOfKind(version, DISPLAY).schema)
  const ranked = (units: LoomUnit[], rank: string) => units.filter((unit) => unit.rank === rank)

  const stanzas: Stanza[] = ranked(tree.roots(), POEM).flatMap((poem) =>
    ranked(tree.children(poem), STANZA).map((stanza) => ({
      lines: ranked(tree.children(stanza), LINE).map(
        (line): Line => ({
          id: line.id,
          text: textOf(version, line),
          number: line.start[0] + 1,
        })
      ),
    }))
  )

  return {
    title: version.metadata.title ?? version.name ?? "Untitled",
    author: version.metadata.author ?? "",
    stanzas,
  }
}
