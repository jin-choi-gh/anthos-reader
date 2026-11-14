import type { Span, Substrate } from "../material/types"
import type { LoomSchema, LoomSpan, LoomUnit, LoomTextualComplex } from "./types"

// What loom's models do (loom/src/models), done on the JSON: the substrate and its spans, and the
// trees of the schemata. Nothing here knows any particular kind of schema.

/** The substrate: the textual complex's lines, in order, as loom's Substrate has them. */
export function substrateOf(textualComplex: LoomTextualComplex): Substrate {
  return { lines: textualComplex.lines.map((line) => line.text) }
}

/** A loom span as the material's: each [line, offset] pair as a position. */
export function spanOf(span: LoomSpan): Span {
  const [startLine, startOffset] = span.start
  const [endLine, endOffset] = span.end
  return {
    start: { line: startLine, offset: startOffset },
    end: { line: endLine, offset: endOffset },
  }
}

/** The one schema of a kind in the textual complex, with its name: loom names schemata by kind and qualifier. */
export function schemaOfKind(
  textualComplex: LoomTextualComplex,
  kind: string,
): { name: string; schema: LoomSchema } {
  const found = Object.entries(textualComplex.schemata).filter(([, schema]) => schema.kind === kind)
  const [first] = found
  if (first === undefined) {
    throw new Error(`${textualComplex.name}: no ${kind} schema`)
  }
  if (found.length > 1) {
    const names = found.map(([name]) => name).join(", ")
    throw new Error(`${textualComplex.name}: several ${kind} schemata: ${names}`)
  }
  const [name, schema] = first
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
