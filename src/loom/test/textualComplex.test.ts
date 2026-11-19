import { describe, expect, it } from "vitest"
import { makeTextualComplex } from "./fixture"
import { SchemaTree, schemaOfKind, spanOf, substrateOf } from "../textualComplex"

const complex = makeTextualComplex([["A Bird, came down", "the 🐦 Walk -", "He did not know"]])

describe("substrateOf and spanOf", () => {
  it("gives the substrate as the textual complex's lines, in order, each with loom's id for it", () => {
    expect(substrateOf(complex)).toEqual({
      lines: [
        { id: "l1", text: "A Bird, came down" },
        { id: "l2", text: "the 🐦 Walk -" },
        { id: "l3", text: "He did not know" },
      ],
    })
  })

  it("copies only each line's id and text", () => {
    const extra = { ...complex, lines: complex.lines.map((line) => ({ ...line, other: 1 })) }
    expect(substrateOf(extra).lines[0]).toStrictEqual({ id: "l1", text: "A Bird, came down" })
  })

  it("turns loom's [line, offset] pairs into positions", () => {
    expect(spanOf({ start: [0, 8], end: [2, 2] })).toEqual({
      start: { line: 0, offset: 8 },
      end: { line: 2, offset: 2 },
    })
  })
})

describe("schemaOfKind", () => {
  it("finds the one schema of a kind, with its name", () => {
    expect(schemaOfKind(complex, "display").name).toBe("display")
  })

  it("refuses a kind that is missing or found twice", () => {
    expect(() => schemaOfKind(complex, "metre")).toThrow("no metre schema")
    const twice = {
      ...complex,
      schemata: { a: complex.schemata.display!, b: complex.schemata.display! },
    }
    expect(() => schemaOfKind(twice, "display")).toThrow("several display schemata: a, b")
  })
})

describe("SchemaTree", () => {
  it("gives the roots and each unit's children in order", () => {
    const tree = new SchemaTree(complex.schemata.display!)
    const poem = tree.roots()[0]!
    const stanza = tree.children(poem)[0]!
    expect(poem.id).toBe("poem")
    expect(tree.children(stanza).map((unit) => unit.id)).toEqual(["line1", "line2", "line3"])
  })
})
