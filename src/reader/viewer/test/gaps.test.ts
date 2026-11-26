import { describe, expect, it } from "vitest"
import type { Span, Substrate } from "../../../material/types"
import type { GapsProjection } from "../../scenes/types"
import { cut } from "../cut"
import { gapRangesOn, pickRangesOn, unitByKey } from "../gaps"

const substrate: Substrate = {
  lines: [
    { id: "l1", text: "A Bird, came down the Walk -" },
    { id: "l2", text: "He bit an Angle Worm in halves" },
    { id: "l3", text: "And ate the fellow, raw," },
  ],
}

const span = (line: number, start: number, end: number): Span => ({
  start: { line, offset: start },
  end: { line, offset: end },
})

const words: GapsProjection = {
  of: "words",
  next: 1,
  gaps: [
    { state: "restored", span: span(0, 2, 6), text: "Bird" },
    { state: "empty", span: span(0, 22, 26) },
    { state: "filled", span: span(2, 8, 11), text: "raw" },
  ],
}

describe("gapRangesOn: each line's gaps", () => {
  it("gives each line the stretches of its gaps, each with its place among the gaps", () => {
    const on = gapRangesOn(substrate, words)
    expect(on(0)).toEqual([
      { start: 2, end: 6, gap: 0 },
      { start: 22, end: 26, gap: 1 },
    ])
    expect(on(1)).toEqual([])
    expect(on(2)).toEqual([{ start: 8, end: 11, gap: 2 }])
  })

  it("gives a line gap the whole line", () => {
    const lines: GapsProjection = {
      of: "lines",
      next: 0,
      gaps: [{ state: "empty", span: span(1, 0, 30) }],
    }
    expect(gapRangesOn(substrate, lines)(1)).toEqual([{ start: 0, end: 30, gap: 0 }])
  })

  it("gives no line any gap when there is no restore", () => {
    expect(gapRangesOn(substrate, null)(0)).toEqual([])
  })

  it("cuts a line at its gaps' edges, so that the text a gap takes out is a piece of its own", () => {
    const pieces = cut(substrate.lines[0]!.text, gapRangesOn(substrate, words)(0))
    expect(pieces.map((piece) => [piece.text, piece.ranges.map((range) => range.gap)])).toEqual([
      ["A ", []],
      ["Bird", [0]],
      [", came down the ", []],
      ["Walk", [1]],
      [" -", []],
    ])
  })
})

describe("pickRangesOn: each line's words or lines to pick", () => {
  it("gives each line the stretches of its units, each with its place among them", () => {
    const on = pickRangesOn(substrate, {
      of: "words",
      units: [
        { span: span(0, 0, 1), taken: false },
        { span: span(0, 2, 6), taken: true },
        { span: span(2, 0, 3), taken: false },
      ],
    })
    expect(on(0)).toEqual([
      { start: 0, end: 1, unit: 0 },
      { start: 2, end: 6, unit: 1 },
    ])
    expect(on(2)).toEqual([{ start: 0, end: 3, unit: 2 }])
    expect(pickRangesOn(substrate, null)(0)).toEqual([])
  })
})

describe("unitByKey: where the arrow keys move among the words to pick", () => {
  // Two words on line 0, one on line 1, two on line 2
  const units = [0, 0, 1, 2, 2].map((line) => ({ span: { start: { line } } }))

  it("moves to the word before or after, and stops at either end", () => {
    expect(unitByKey(units, 1, "ArrowRight")).toBe(2)
    expect(unitByKey(units, 1, "ArrowLeft")).toBe(0)
    expect(unitByKey(units, 0, "ArrowLeft")).toBeNull()
    expect(unitByKey(units, 4, "ArrowRight")).toBeNull()
  })

  it("moves to the first word of the line before or after", () => {
    expect(unitByKey(units, 4, "ArrowUp")).toBe(2)
    expect(unitByKey(units, 2, "ArrowUp")).toBe(0)
    expect(unitByKey(units, 1, "ArrowDown")).toBe(2)
    expect(unitByKey(units, 3, "ArrowDown")).toBeNull()
  })

  it("moves to the first or the last, and to nowhere for another key", () => {
    expect(unitByKey(units, 2, "Home")).toBe(0)
    expect(unitByKey(units, 2, "End")).toBe(4)
    expect(unitByKey(units, 2, "a")).toBeNull()
  })
})
