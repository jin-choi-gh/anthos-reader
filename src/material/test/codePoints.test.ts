import { describe, expect, it } from "vitest"
import { codePoints, isSpace } from "../codePoints"

describe("codePoints", () => {
  it("counts a character beyond the basic plane as one", () => {
    expect(codePoints("a\u{1F426}b")).toEqual(["a", "\u{1F426}", "b"])
  })
})

describe("isSpace: a space as loom counts one", () => {
  it("counts spaces, tabs and the wider spaces", () => {
    for (const space of [" ", "\t", "\u{A0}", "\u{2003}", "\u{3000}"]) {
      expect(isSpace(space), JSON.stringify(space)).toBe(true)
    }
  })

  it("counts what Python counts and JavaScript does not, and not the other way", () => {
    expect(isSpace("\u{1F}")).toBe(true)
    expect(isSpace("\u{85}")).toBe(true)
    expect(isSpace("\u{FEFF}")).toBe(false)
  })

  it("counts no character, past a line's end, as one, and no letter", () => {
    expect(isSpace(undefined)).toBe(true)
    expect(isSpace("a")).toBe(false)
    expect(isSpace("\u{1F426}")).toBe(false)
  })
})
