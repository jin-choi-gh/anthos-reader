import { describe, expect, it } from "vitest"
import { makeTextualComplex } from "./fixture"
import { toPoem } from "../toPoem"

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
    })
  })

  it("takes its title and poet from the metadata", () => {
    const poem = toPoem(
      makeTextualComplex([["one"]], { metadata: { title: "Poem 159", author: "Emily Dickinson" } }),
    )
    expect(poem.title).toBe("Poem 159")
    expect(poem.author).toBe("Emily Dickinson")
  })
})
