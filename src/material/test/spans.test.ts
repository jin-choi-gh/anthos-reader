import { describe, expect, it } from "vitest"
import { codePoints } from "../codePoints"
import { lineLength, sameSpan, spanProblem, textOf, wholePoem } from "../spans"
import type { Span, Substrate } from "../types"

const substrate: Substrate = { lines: ["A Bird, came down", "the 🐦 Walk -", "He did not know"] }

const span = (
  startLine: number,
  startOffset: number,
  endLine: number,
  endOffset: number,
): Span => ({
  start: { line: startLine, offset: startOffset },
  end: { line: endLine, offset: endOffset },
})

describe("textOf", () => {
  it("cuts a span within one line", () => {
    expect(textOf(substrate, span(0, 2, 0, 6))).toBe("Bird")
  })

  it("joins a span's lines with line breaks", () => {
    expect(textOf(substrate, span(0, 8, 2, 2))).toBe("came down\nthe 🐦 Walk -\nHe")
  })

  it("counts offsets in code points", () => {
    expect(textOf(substrate, span(1, 4, 1, 5))).toBe("🐦")
    expect(lineLength(substrate, 1)).toBe(12)
    expect(codePoints("🐦a")).toEqual(["🐦", "a"])
  })

  it("names a line that is not there", () => {
    expect(() => textOf(substrate, span(5, 0, 5, 1))).toThrow("no line at index 5")
  })
})

describe("spanProblem: loom's rule for spans", () => {
  it("finds nothing wrong with a passage, whole lines, or a point inside a line", () => {
    expect(spanProblem(substrate, span(0, 2, 0, 6))).toBeNull()
    expect(spanProblem(substrate, span(0, 0, 2, 15))).toBeNull()
    expect(spanProblem(substrate, span(1, 4, 1, 4))).toBeNull()
  })

  it("refuses a span outside the poem", () => {
    expect(spanProblem(substrate, span(0, 0, 3, 1))).toBe("4:2 is not in the poem")
    expect(spanProblem(substrate, span(0, 0, 0, 18))).toBe("1:19 is not in the poem")
    expect(spanProblem(substrate, span(0, -1, 0, 3))).toBe("1:0 is not in the poem")
    expect(spanProblem(substrate, span(0, 0.5, 0, 3))).toBe("1:1.5 is not in the poem")
  })

  it("refuses a span that runs backwards", () => {
    expect(spanProblem(substrate, span(1, 3, 0, 4))).toBe("2:4–1:5 runs backwards")
    expect(spanProblem(substrate, span(0, 6, 0, 2))).toBe("1:7–1:3 runs backwards")
  })

  it("refuses a span starting at a line's end, or ending at a line's start", () => {
    expect(spanProblem(substrate, span(0, 17, 1, 3))).toBe("1:18–2:4 starts at the end of a line")
    expect(spanProblem(substrate, span(0, 2, 1, 0))).toBe("1:3–2:1 ends at the start of a line")
  })
})

describe("wholePoem", () => {
  it("runs from the start of the first line to the end of the last, in code points", () => {
    expect(wholePoem(substrate)).toEqual(span(0, 0, 2, 15))
    expect(wholePoem({ lines: ["A Bird", "came 🐦"] })).toEqual(span(0, 0, 1, 6))
  })

  it("leaves out lines with no text at either end, so that it keeps loom's rule", () => {
    const edged = { lines: ["", "A Bird", "", "came down", ""] }
    expect(wholePoem(edged)).toEqual(span(1, 0, 3, 9))
    expect(spanProblem(edged, wholePoem(edged))).toBeNull()
  })

  it("throws for a poem with no text", () => {
    expect(() => wholePoem({ lines: [] })).toThrow("the poem has no text")
    expect(() => wholePoem({ lines: ["", ""] })).toThrow("the poem has no text")
  })
})

describe("sameSpan", () => {
  it("is true only for the same start and the same end", () => {
    expect(sameSpan(span(0, 2, 0, 6), span(0, 2, 0, 6))).toBe(true)
    expect(sameSpan(span(0, 2, 0, 6), span(0, 2, 0, 7))).toBe(false)
    expect(sameSpan(span(0, 2, 0, 6), span(1, 2, 0, 6))).toBe(false)
  })
})
