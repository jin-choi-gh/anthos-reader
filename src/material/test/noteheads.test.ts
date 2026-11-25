import { describe, expect, it } from "vitest"
import { codePoints } from "../codePoints"
import { noteheadOf, spansOfNotehead } from "../noteheads"
import { joinSpan, trimmedSpan, wordAt } from "../spans"
import type { Position, Span, Substrate } from "../types"
import { DICKINSON, DICKINSON_NOTES } from "./dickinson"
import { CASES, LINES, LOOM_COMMIT } from "./loomParity"

const span = (
  startLine: number,
  startOffset: number,
  endLine: number,
  endOffset: number,
): Span => ({
  start: { line: startLine, offset: startOffset },
  end: { line: endLine, offset: endOffset },
})

const asSpans = (spans: readonly (readonly [number, number, number, number])[]) =>
  spans.map(([a, b, c, d]) => span(a, b, c, d))

const tricky: Substrate = { lines: LINES }
const dickinson: Substrate = { lines: DICKINSON }

/** The spans a notehead places, failing the test if it cannot be placed. */
function placed(substrate: Substrate, notehead: string): readonly Span[] {
  const result = spansOfNotehead(substrate, notehead)
  if ("problem" in result) throw new Error(`${notehead}: ${result.problem}`)
  return result.spans
}

/** Why a notehead cannot be placed, failing the test if it can. */
function problem(substrate: Substrate, notehead: string): string {
  const result = spansOfNotehead(substrate, notehead)
  if ("spans" in result) throw new Error(`${notehead} was placed`)
  return result.problem
}

// The noteheads loom takes and anthos refuses, and why
const ANTHOS_REFUSES = new Map([
  ["l3", "starts at the end of a line"], // the whole of a line with no text: a span of no length
  [" l1", "not a space"], // loom would read it, in a notes file, as part of the note above
  ["\tl1", "not a space"],
  ["l1\u{85}", "no line break"], // a line break to loom, which would end the head there
  ["l4 ever[\u{662}]", "digits 0 to 9"],
])

describe("spansOfNotehead: placing a notehead as loom does", () => {
  it(`agrees with loom ${LOOM_COMMIT} on every notehead of the table`, () => {
    for (const { notehead, loom } of CASES) {
      const result = spansOfNotehead(tricky, notehead)
      const refusal = ANTHOS_REFUSES.get(notehead)
      if (refusal !== undefined) {
        expect(result, notehead).toEqual({ problem: expect.stringContaining(refusal) })
      } else if (loom === null) {
        expect(result, notehead).toEqual({ problem: expect.any(String) })
      } else {
        expect(result, notehead).toEqual({ spans: asSpans(loom) })
      }
    }
  })

  it("refuses, of the table, only what loom refuses and the five anthos refuses beyond it", () => {
    const refusedOnlyHere = CASES.filter(
      ({ notehead, loom }) => loom !== null && "problem" in spansOfNotehead(tricky, notehead),
    ).map(({ notehead }) => notehead)
    expect(refusedOnlyHere).toEqual([...ANTHOS_REFUSES.keys()])
  })

  it("places the editor's heads on Dickinson's poem where loom placed them", () => {
    for (const note of DICKINSON_NOTES) {
      expect(placed(dickinson, note.head), note.id).toEqual(asSpans(note.spans))
    }
  })

  it("places a whole line, a quote, and a range from one locator's start to the other's end", () => {
    expect(placed(dickinson, "l4")).toEqual([span(3, 0, 3, 24)])
    expect(placed(dickinson, "l4 fellow")).toEqual([span(3, 12, 3, 18)])
    expect(placed(dickinson, "l2 He ~ l3 halves")).toEqual([span(1, 0, 2, 30)])
    expect(placed(dickinson, "l4 fellow && l4 raw")).toEqual([
      span(3, 12, 3, 18),
      span(3, 20, 3, 23),
    ])
  })

  it("counts offsets in code points, and matches quotes in NFC", () => {
    expect(placed(tricky, "l6 \u{1F426} Walk")).toEqual([span(5, 4, 5, 10)])
    expect(placed(tricky, "l6 cafe\u{301}")).toEqual([span(5, 13, 5, 17)])
  })

  it("strips and splits on the spaces loom counts, not JavaScript's", () => {
    expect(placed(tricky, "l1\u{1F}")).toEqual([span(0, 0, 0, 3)])
    expect(problem(tricky, "l1\u{FEFF}")).toBe("no line called l1\u{FEFF}")
  })

  it("says why it cannot place a notehead, in loom's words", () => {
    expect(problem(tricky, "")).toBe("a notehead with no targets")
    expect(problem(tricky, "l99")).toBe("no line called l99")
    expect(problem(tricky, "l1 && ")).toBe("an empty target")
    expect(problem(tricky, "l4  ever")).toBe("one space between l4 and its quote")
    expect(problem(tricky, "l4 ever[0]")).toBe("occurrences count from 1, not 0")
    expect(problem(tricky, "l4 ever [2]")).toBe("no space before [2]")
    expect(problem(tricky, "l1 a ~ l2 x ~ l4")).toBe('"l1 a ~ l2 x ~ l4" has more than one ~')
    expect(problem(tricky, "l4 worm")).toBe(
      'l4 "worm": "worm" is not in line l4: "note[3] and ever ever"',
    )
    expect(problem(tricky, "l1 aa[2]")).toBe('l1 "aa"[2]: "aa" is only 1 time(s) in line l1: "aaa"')
    expect(problem(tricky, "l4 ever[2] ~ l4 ever")).toBe(
      'the range must run forwards: l4 "ever" does not come after l4 "ever"[2]',
    )
  })

  it("says why it refuses what loom takes", () => {
    expect(problem(tricky, "l3")).toBe("l3: 3:1–3:1 starts at the end of a line")
    expect(problem(tricky, " l1")).toBe("a notehead starts with a line's id, not a space")
    expect(problem(tricky, "l1\nl2")).toBe("a notehead is one line, with no line break")
    expect(problem(tricky, "l4 ever[\u{662}]")).toBe(
      "[\u{662}]: write an occurrence in the digits 0 to 9",
    )
  })

  it("stops counting at the last occurrence, however many are asked for", () => {
    expect(problem(tricky, "l1 a[99999999999999999999]")).toContain("only 3 time(s)")
  })
})

describe("noteheadOf: spans written as a notehead", () => {
  it("writes the editor's notes on Dickinson's poem in its standard wording", () => {
    const written = Object.fromEntries(
      DICKINSON_NOTES.map((note) => [note.id, noteheadOf(dickinson, asSpans(note.spans))]),
    )
    expect(written).toEqual({
      "bird-violence-1": "l2 ~ l3",
      "bird-violence-2": "l4 fellow && l4 raw",
      "bird-convenience-1": "l5 ~ l6",
      "bird-convenience-2": "l7 ~ l8",
      "bird-afraid-1": "l9 ~ l11",
      "bird-afraid-2": "l12 ~ l14",
      "bird-flies-1": "l15 ~ l16",
      "bird-flies-2": "l17 ~ l20",
      "poet-projects-1": "l4 fellow && l8 && l12 Velvet Head && l14 I offered him a Crumb",
      "poet-projects-2": "l3 ~ l4 && l11 && l13 ~ l14 && l16",
      "poet-achieves-1": "l17 ~ l20",
    })
  })

  it("writes a passage across lines by its first and last words", () => {
    expect(noteheadOf(dickinson, [span(1, 3, 2, 6)])).toBe("l2 did ~ l3 bit")
  })

  it("writes the occurrence of a quote that is not the first, or that ends in ]", () => {
    expect(noteheadOf(tricky, [span(3, 17, 3, 21)])).toBe("l4 ever[2]")
    expect(noteheadOf(tricky, [span(3, 0, 3, 7)])).toBe("l4 note[3][1]")
  })

  it("writes by characters what loom would misread or never reach as a quote", () => {
    expect(noteheadOf(tricky, [span(0, 1, 0, 3)])).toBe("l1 a[2] ~ l1 a[3]")
    expect(noteheadOf(tricky, [span(1, 2, 1, 5)])).toBe("l2 ~[1] ~ l2 y[1]")
    expect(noteheadOf(tricky, [span(1, 0, 1, 5)])).toBe("l2 x ~ l2 y")
  })

  it("writes every target by its characters when the targets, joined, would be misread", () => {
    const substrate: Substrate = {
      lines: [
        { id: "l1", text: "b && c" },
        { id: "l2", text: "aaa" },
      ],
    }
    // "l1 b && && l2" places alone as two targets, but is read as "l1 b" and a line called "&&"
    const spans = [span(0, 0, 0, 4), span(1, 0, 1, 3)]
    expect(noteheadOf(substrate, spans)).toBe("l1 b[1] ~ l1 &[2] && l2 a[1] ~ l2 a[3]")
    expect(placed(substrate, "l1 b[1] ~ l1 &[2] && l2 a[1] ~ l2 a[3]")).toEqual(spans)
  })

  it("is null for what loom cannot write", () => {
    expect(noteheadOf(dickinson, [])).toBeNull()
    expect(noteheadOf(dickinson, [span(0, 2, 0, 2)])).toBeNull() // no length
    expect(noteheadOf(dickinson, [span(0, 1, 0, 6)])).toBeNull() // starts on a space
    expect(noteheadOf(dickinson, [span(0, 2, 0, 8)])).toBeNull() // ends on a space
    expect(noteheadOf(dickinson, [span(0, 28, 1, 2)])).toBeNull() // breaks loom's rule
    expect(noteheadOf(tricky, [span(2, 0, 2, 0)])).toBeNull() // a line with no text
  })

  it("writes every passage the viewer can choose, so that placing it gives it back", () => {
    for (const substrate of [tricky, dickinson]) {
      for (const passage of passagesOf(substrate)) {
        const notehead = noteheadOf(substrate, [passage])
        expect(notehead, JSON.stringify(passage)).not.toBeNull()
        expect(placed(substrate, notehead!)).toEqual([passage])
        expect(notehead).toMatch(/^\S[^\n\r]*$/u)
      }
    }
  })

  it("writes several passages, joined as the viewer joins them, so that placing gives them back", () => {
    for (const substrate of [tricky, dickinson]) {
      const passages = passagesOf(substrate).filter((_, i) => i % 13 === 0)
      for (const [i, a] of passages.entries()) {
        const b = passages[(i * 7 + 3) % passages.length]!
        const c = passages[(i * 11 + 5) % passages.length]!
        const spans = joinSpan(joinSpan([a], b), c)
        const notehead = noteheadOf(substrate, spans)
        expect(notehead, JSON.stringify(spans)).not.toBeNull()
        expect(placed(substrate, notehead!)).toEqual(spans)
      }
    }
  })
})

/** Passages as the viewer chooses them: trimmed between two positions, or from word to word. On a
 * short poem, between every two positions; on a long one, every passage within a line, and from
 * each word's start to each later word's end. */
function passagesOf(substrate: Substrate): Span[] {
  const positions: Position[] = substrate.lines.flatMap((line, i) =>
    Array.from({ length: codePoints(line.text).length + 1 }, (_, offset) => ({ line: i, offset })),
  )
  const short = positions.length <= 200
  const words = positions
    .map((position) => wordAt(substrate, position))
    .filter((word): word is Span => word !== null)
  const pairs: [Position, Position][] = short
    ? positions.flatMap((a) => positions.map((b): [Position, Position] => [a, b]))
    : [
        ...positions.flatMap((a) =>
          positions.filter((b) => b.line === a.line).map((b): [Position, Position] => [a, b]),
        ),
        ...words.flatMap((a) => words.map((b): [Position, Position] => [a.start, b.end])),
      ]
  const seen = new Map<string, Span>()
  for (const [a, b] of pairs) {
    const passage = trimmedSpan(substrate, a, b)
    if (passage !== null) seen.set(JSON.stringify(passage), passage)
  }
  return [...seen.values()]
}
