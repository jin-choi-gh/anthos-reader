import { describe, expect, it } from "vitest"
import { fingerprintOf, hashOf } from "../fingerprint"
import type { Substrate } from "../types"

/** A substrate of these lines, each with the id loom would give it: "l1", "l2", and on. */
const substrateWith = (texts: readonly string[]): Substrate => ({
  lines: texts.map((text, i) => ({ id: `l${i + 1}`, text })),
})

const texts = ["A Bird, came down the Walk -", "He did not know I saw -"]
const lines = substrateWith(texts)

describe("fingerprintOf", () => {
  it("gives the same lines the same fingerprint, as 14 hex digits", () => {
    expect(fingerprintOf(lines)).toBe(fingerprintOf(substrateWith([...texts])))
    expect(fingerprintOf(lines)).toMatch(/^[0-9a-f]{14}$/)
  })

  it("gives other lines another fingerprint", () => {
    const changed = ["A Bird, came down the Walk –", "He did not know I saw -"]
    expect(fingerprintOf(substrateWith(changed))).not.toBe(fingerprintOf(lines))
    expect(fingerprintOf(substrateWith([texts.join(" ")]))).not.toBe(fingerprintOf(lines))
    expect(fingerprintOf(substrateWith([...texts, ""]))).not.toBe(fingerprintOf(lines))
  })

  it("is of the lines' text alone, not their ids", () => {
    const renamed: Substrate = { lines: texts.map((text, i) => ({ id: `line-${i}`, text })) }
    expect(fingerprintOf(renamed)).toBe(fingerprintOf(lines))
  })

  it("is the fingerprint these lines have always had, so that no reader's run starts again", () => {
    expect(fingerprintOf(lines)).toBe("029eea8eff86c8")
  })
})

describe("hashOf: the hash behind every fingerprint", () => {
  it("is the lines' fingerprint, for the lines' text joined by line breaks", () => {
    expect(hashOf(texts.join("\n"))).toBe(fingerprintOf(lines))
  })

  it("gives the same text the same hash, and another text another", () => {
    expect(hashOf("worm")).toBe(hashOf("worm"))
    expect(hashOf("worm")).not.toBe(hashOf("worms"))
    expect(hashOf("")).toMatch(/^[0-9a-f]{14}$/)
  })
})
