import { describe, expect, it } from "vitest"
import { fingerprintOf } from "../../material/fingerprint"
import { makeTextualComplex } from "./fixture"
import { toMaterial } from "../toMaterial"

/** Lines of the substrate, each with the id loom would give it: "l1", "l2", and on. */
const withIds = (texts: readonly string[]) => texts.map((text, i) => ({ id: `l${i + 1}`, text }))

const stanzas = [
  ["A Bird, came down the Walk -", "He did not know I saw -", "He bit an Angle Worm in halves"],
]

describe("toMaterial", () => {
  it("builds the substrate, its words, its fingerprint and the poem together", () => {
    const material = toMaterial(makeTextualComplex(stanzas))
    expect(material.substrate).toEqual({ lines: withIds(stanzas[0]!) })
    expect(material.fingerprint).toBe(fingerprintOf({ lines: withIds(stanzas[0]!) }))
    expect(material.poem.stanzas[0]!.lines.map((line) => line.text)).toEqual(stanzas[0])
    expect(material.words).toHaveLength(6 + 6 + 7)
    expect(material.words[0]).toEqual({
      start: { line: 0, offset: 0 },
      end: { line: 0, offset: 1 },
    })
  })

  it("does not read loom's annotations, even one whose target breaks loom's rule for spans", () => {
    const complex = makeTextualComplex(stanzas, {
      annotations: [
        { targets: [{ start: [0, 28], end: [1, 2] }], body: "Starts at a line's end." },
      ],
    })
    expect(Object.keys(toMaterial(complex))).toEqual(["substrate", "words", "fingerprint", "poem"])
  })

  it("refuses a poem with no text", () => {
    expect(() => toMaterial(makeTextualComplex([["", ""]]))).toThrow(
      "fixture: the poem has no text",
    )
  })
})
