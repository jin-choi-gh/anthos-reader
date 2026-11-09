import { describe, expect, it } from "vitest"
import { makeTextualComplex } from "./fixture"
import { toPoem } from "../toPoem"
import type { LoomTextualComplex } from "../types"

/** Gives one display unit another value, as a file from elsewhere (TEI, say) might carry. */
function setLineValue(complex: LoomTextualComplex, id: string, value: string | null) {
  const unit = complex.schemata.display.units.find((u) => u.id === id)
  if (unit === undefined) throw new Error(`no unit ${id}`)
  unit.value = value
}

describe("toPoem", () => {
  it("gives the stanzas and lines of the display schema, numbered from 1", () => {
    const poem = toPoem(makeTextualComplex([["one", "two"], ["three"]]))
    expect(poem.stanzas.map((stanza) => stanza.lines.map((line) => line.text))).toEqual([
      ["one", "two"],
      ["three"],
    ])
    expect(poem.stanzas[1].lines[0]).toEqual({
      id: "line3",
      text: "three",
      indexInSubstrate: 2,
      number: 3,
      indent: 0,
    })
  })

  it("gives each line its indent level, from the line unit's value", () => {
    const poem = toPoem(makeTextualComplex([["A Bird", "\tcame down", "\t\tthe Walk"]]))
    expect(poem.stanzas[0].lines.map((line) => [line.text, line.indent])).toEqual([
      ["A Bird", 0],
      ["came down", 1],
      ["the Walk", 2],
    ])
  })

  it("reads a line with no value as unindented", () => {
    const complex = makeTextualComplex([["one"]])
    setLineValue(complex, "line1", null)
    expect(toPoem(complex).stanzas[0].lines[0].indent).toBe(0)
  })

  it("refuses an indent that is not a whole number from 0, naming the line", () => {
    for (const value of ["2em", "-1", "1.5", ""]) {
      const complex = makeTextualComplex([["one"]])
      setLineValue(complex, "line1", value)
      expect(() => toPoem(complex)).toThrow(`line line1 has indent ${JSON.stringify(value)}`)
    }
  })

  it("takes its title and poet from the metadata", () => {
    const poem = toPoem(
      makeTextualComplex([["one"]], { metadata: { title: "Poem 159", author: "Emily Dickinson" } }),
    )
    expect(poem.title).toBe("Poem 159")
    expect(poem.author).toBe("Emily Dickinson")
  })
})
