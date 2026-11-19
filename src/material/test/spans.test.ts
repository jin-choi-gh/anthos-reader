import { describe, expect, it } from "vitest"
import { codePoints } from "../codePoints"
import {
  comparePositions,
  joinSpan,
  lineLength,
  lineRangesOf,
  sameSpan,
  spanProblem,
  textOf,
  trimmedSpan,
  wholePoem,
  wordAt,
} from "../spans"
import type { Span, Substrate } from "../types"

/** Lines of the substrate, each with the id loom would give it: "l1", "l2", and on. */
const withIds = (texts: readonly string[]) => texts.map((text, i) => ({ id: `l${i + 1}`, text }))

const substrate: Substrate = {
  lines: withIds(["A Bird, came down", "the 🐦 Walk -", "He did not know"]),
}

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
    expect(wholePoem({ lines: withIds(["A Bird", "came 🐦"]) })).toEqual(span(0, 0, 1, 6))
  })

  it("leaves out lines with no text at either end, so that it keeps loom's rule", () => {
    const edged = { lines: withIds(["", "A Bird", "", "came down", ""]) }
    expect(wholePoem(edged)).toEqual(span(1, 0, 3, 9))
    expect(spanProblem(edged, wholePoem(edged))).toBeNull()
  })

  it("throws for a poem with no text", () => {
    expect(() => wholePoem({ lines: withIds([]) })).toThrow("the poem has no text")
    expect(() => wholePoem({ lines: withIds(["", ""]) })).toThrow("the poem has no text")
  })
})

describe("sameSpan", () => {
  it("is true only for the same start and the same end", () => {
    expect(sameSpan(span(0, 2, 0, 6), span(0, 2, 0, 6))).toBe(true)
    expect(sameSpan(span(0, 2, 0, 6), span(0, 2, 0, 7))).toBe(false)
    expect(sameSpan(span(0, 2, 0, 6), span(1, 2, 0, 6))).toBe(false)
  })
})

const at = (line: number, offset: number) => ({ line, offset })

describe("comparePositions", () => {
  it("orders positions by line, then by offset", () => {
    expect(comparePositions(at(0, 5), at(1, 0))).toBeLessThan(0)
    expect(comparePositions(at(1, 2), at(1, 1))).toBeGreaterThan(0)
    expect(comparePositions(at(1, 2), at(1, 2))).toBe(0)
  })
})

describe("trimmedSpan: a span loom can always write", () => {
  it("runs from whichever position comes first", () => {
    expect(trimmedSpan(substrate, at(0, 7), at(0, 2))).toEqual(span(0, 2, 0, 7))
  })

  it("leaves out the spaces at either end", () => {
    expect(trimmedSpan(substrate, at(0, 1), at(0, 8))).toEqual(span(0, 2, 0, 7))
  })

  it("starts on the next line rather than at a line's end, and ends on the line before rather than at its start", () => {
    expect(trimmedSpan(substrate, at(0, 17), at(1, 4))).toEqual(span(1, 0, 1, 3))
    expect(trimmedSpan(substrate, at(0, 13), at(1, 0))).toEqual(span(0, 13, 0, 17))
  })

  it("is null when nothing but spaces and line ends lie between", () => {
    expect(trimmedSpan(substrate, at(0, 7), at(0, 8))).toBeNull()
    expect(trimmedSpan(substrate, at(0, 3), at(0, 3))).toBeNull()
    expect(trimmedSpan(substrate, at(0, 17), at(1, 0))).toBeNull()
  })

  it("counts in code points, and always keeps loom's rule", () => {
    expect(trimmedSpan(substrate, at(1, 4), at(1, 5))).toEqual(span(1, 4, 1, 5))
    for (const [a, b] of [
      [at(0, 1), at(2, 3)],
      [at(0, 17), at(2, 0)],
      [at(1, 3), at(1, 12)],
    ] as const) {
      const trimmed = trimmedSpan(substrate, a, b)
      expect(trimmed).not.toBeNull()
      expect(spanProblem(substrate, trimmed!)).toBeNull()
    }
  })
})

describe("wordAt", () => {
  it("is the run of non-space characters at a position, its punctuation with it", () => {
    expect(wordAt(substrate, at(0, 3))).toEqual(span(0, 2, 0, 7))
    expect(wordAt(substrate, at(0, 2))).toEqual(span(0, 2, 0, 7))
  })

  it("takes the word just before when the position is at its end", () => {
    expect(wordAt(substrate, at(0, 7))).toEqual(span(0, 2, 0, 7))
    expect(wordAt(substrate, at(2, 15))).toEqual(span(2, 11, 2, 15))
  })

  it("counts a character outside the basic plane as one", () => {
    expect(wordAt(substrate, at(1, 4))).toEqual(span(1, 4, 1, 5))
  })

  it("is null between words", () => {
    expect(wordAt({ lines: withIds(["a  b"]) }, at(0, 2))).toBeNull()
  })
})

describe("joinSpan: chosen passages that never overlap", () => {
  it("keeps spans apart that neither overlap nor touch, in the poem's order", () => {
    expect(joinSpan([span(1, 0, 1, 3)], span(0, 2, 0, 7))).toEqual([
      span(0, 2, 0, 7),
      span(1, 0, 1, 3),
    ])
  })

  it("joins a span with one it overlaps, contains, or touches with nothing between", () => {
    expect(joinSpan([span(0, 2, 0, 7)], span(0, 5, 0, 12))).toEqual([span(0, 2, 0, 12)])
    expect(joinSpan([span(0, 2, 0, 4)], span(0, 4, 0, 7))).toEqual([span(0, 2, 0, 7)])
    expect(joinSpan([span(0, 2, 0, 12)], span(0, 3, 0, 5))).toEqual([span(0, 2, 0, 12)])
  })

  it("joins every span the new one reaches, and keeps the rest", () => {
    const chosen = [span(0, 2, 0, 7), span(0, 8, 0, 12), span(2, 0, 2, 2)]
    expect(joinSpan(chosen, span(0, 0, 1, 3))).toEqual([span(0, 0, 1, 3), span(2, 0, 2, 2)])
  })

  it("counts a line break as something between", () => {
    expect(joinSpan([span(0, 13, 0, 17)], span(1, 0, 1, 3))).toEqual([
      span(0, 13, 0, 17),
      span(1, 0, 1, 3),
    ])
  })
})

describe("lineRangesOf", () => {
  it("gives a span's stretch on each line it crosses", () => {
    expect(lineRangesOf(substrate, span(0, 13, 2, 2))).toEqual([
      { line: 0, start: 13, end: 17 },
      { line: 1, start: 0, end: 12 },
      { line: 2, start: 0, end: 2 },
    ])
  })
})
