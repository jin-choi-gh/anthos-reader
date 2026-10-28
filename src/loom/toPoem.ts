import type { Line, Poem, Stanza } from "../reader/types"
import type { LoomVersion } from "./types"

/** The reader's Poem from a loom version: the stanzas and lines of its display schema, and its metadata. */
export function toPoem(version: LoomVersion): Poem {
  const display = version.schemata["display"]
  if (display === undefined) {
    throw new Error(`${version.name}: no display schema`)
  }
  const texts = new Map(version.lines.map((line) => [line.id, line.text]))

  const stanzas: Stanza[] = display.units
    .filter((unit) => unit.rank === "stanza")
    .map((stanza) => ({
      lines: display.units
        .filter((unit) => unit.rank === "line" && unit.parent === stanza.id)
        .map((unit): Line => ({ id: unit.id, text: textOf(unit.id, texts) })),
    }))

  return {
    title: version.metadata.title ?? version.name ?? "Untitled",
    poet: version.metadata.author ?? "",
    stanzas,
  }
}

function textOf(id: string, texts: Map<string, string>): string {
  const text = texts.get(id)
  if (text === undefined) {
    throw new Error(`line ${id} is in the display schema but not among the lines`)
  }
  return text
}
