import { describe, expect, it } from "vitest"
import { makeTextualComplex } from "./fixture"
import { codePoints } from "../../material/codePoints"
import { SchemaTree, lineLength, schemaOfKind, textOf } from "../textualComplex"

const complex = makeTextualComplex([["A Bird, came down", "the 🐦 Walk -", "He did not know"]])

describe("textOf", () => {
  it("cuts a span within one line", () => {
    expect(textOf(complex, { start: [0, 2], end: [0, 6] })).toBe("Bird")
  })

  it("joins a span's lines with line breaks", () => {
    expect(textOf(complex, { start: [0, 8], end: [2, 2] })).toBe("came down\nthe 🐦 Walk -\nHe")
  })

  it("counts offsets in code points", () => {
    expect(textOf(complex, { start: [1, 4], end: [1, 5] })).toBe("🐦")
    expect(lineLength(complex, 1)).toBe(12)
    expect(codePoints("🐦a")).toEqual(["🐦", "a"])
  })

  it("names a line that is not there", () => {
    expect(() => textOf(complex, { start: [5, 0], end: [5, 1] })).toThrow("no line at index 5")
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
