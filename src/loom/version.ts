import type { LoomSchema, LoomSpan, LoomUnit, LoomVersion } from "./types"

// What loom's models do (loom/src/models), done on the JSON: the substrate's text, and the trees of
// the schemata. Nothing here knows any particular kind of schema.

/** The text a span covers, as loom's Substrate.text_of gives it: across lines, each line's part,
 * joined by line breaks. Offsets count code points, as Python's do, not UTF-16 units. */
export function textOf(version: LoomVersion, span: LoomSpan): string {
  const [startLine, startOffset] = span.start
  const [endLine, endOffset] = span.end
  const line = (index: number) => codePoints(lineAt(version, index).text)
  if (startLine === endLine) {
    return line(startLine).slice(startOffset, endOffset).join("")
  }
  const first = line(startLine).slice(startOffset).join("")
  const middle = version.lines.slice(startLine + 1, endLine).map((l) => l.text)
  const last = line(endLine).slice(0, endOffset).join("")
  return [first, ...middle, last].join("\n")
}

/** The one schema of a kind in the version, with its name: loom names schemata by kind and qualifier. */
export function schemaOfKind(
  version: LoomVersion,
  kind: string
): { name: string; schema: LoomSchema } {
  const found = Object.entries(version.schemata).filter(([, schema]) => schema.kind === kind)
  if (found.length === 0) {
    throw new Error(`${version.name}: no ${kind} schema`)
  }
  if (found.length > 1) {
    const names = found.map(([name]) => name).join(", ")
    throw new Error(`${version.name}: several ${kind} schemata: ${names}`)
  }
  const [name, schema] = found[0]
  return { name, schema }
}

/** A schema's tree, as loom's Schema gives it: its roots, and each unit's children, in reading order. */
export class SchemaTree {
  private readonly byParent = new Map<string | null, LoomUnit[]>()

  constructor(schema: LoomSchema) {
    for (const unit of schema.units) {
      const siblings = this.byParent.get(unit.parent)
      if (siblings === undefined) this.byParent.set(unit.parent, [unit])
      else siblings.push(unit)
    }
  }

  roots(): LoomUnit[] {
    return this.byParent.get(null) ?? []
  }

  children(unit: LoomUnit): LoomUnit[] {
    return this.byParent.get(unit.id) ?? []
  }
}

function lineAt(version: LoomVersion, index: number) {
  const line = version.lines[index]
  if (line === undefined) {
    throw new Error(`${version.name}: no line at index ${index}`)
  }
  return line
}

function codePoints(text: string): string[] {
  return Array.from(text)
}
