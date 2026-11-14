import { describe, expect, it } from "vitest"
import type { Span, Substrate } from "../../../material/types"
import { CHOOSING, choosingBy, passageOf, rangesOnLines } from "../choosing"

const substrate: Substrate = {
  lines: [
    "A Bird, came down the Walk -",
    "He did not know I saw -",
    "He bit an Angle Worm in halves",
  ],
}

const at = (line: number, offset: number) => ({ line, offset })
const span = (
  startLine: number,
  startOffset: number,
  endLine: number,
  endOffset: number,
): Span => ({
  start: at(startLine, startOffset),
  end: at(endLine, endOffset),
})

describe("choosingBy: how each pointer chooses", () => {
  it("drags to the character with a mouse or a pen, and taps whole words with a finger", () => {
    expect(choosingBy("mouse")).toEqual({ gesture: "drag", precision: "character" })
    expect(choosingBy("pen")).toBe(CHOOSING.pen)
    expect(choosingBy("touch")).toEqual({ gesture: "taps", precision: "word" })
  })

  it("takes a pointer the browser does not name for a mouse", () => {
    expect(choosingBy("")).toBe(CHOOSING.mouse)
  })
})

describe("passageOf: to the character", () => {
  it("is what lies between the two positions, in either order, without spaces at its ends", () => {
    expect(passageOf(substrate, at(0, 1), at(0, 8), "character")).toEqual(span(0, 2, 0, 7))
    expect(passageOf(substrate, at(0, 8), at(0, 1), "character")).toEqual(span(0, 2, 0, 7))
  })

  it("is nothing for a click, or for a drag over nothing but spaces", () => {
    expect(passageOf(substrate, at(0, 4), at(0, 4), "character")).toBeNull()
    expect(passageOf(substrate, at(0, 7), at(0, 8), "character")).toBeNull()
  })
})

describe("passageOf: to whole words", () => {
  it("runs from the start of the first word tapped to the end of the last, in either order", () => {
    expect(passageOf(substrate, at(0, 3), at(1, 4), "word")).toEqual(span(0, 2, 1, 6))
    expect(passageOf(substrate, at(1, 4), at(0, 3), "word")).toEqual(span(0, 2, 1, 6))
  })

  it("is one word when the same word is tapped twice", () => {
    expect(passageOf(substrate, at(2, 11), at(2, 13), "word")).toEqual(span(2, 10, 2, 15))
  })

  it("is nothing when a tap falls between words", () => {
    expect(passageOf({ lines: ["a  b"] }, at(0, 2), at(0, 3), "word")).toBeNull()
  })
})

describe("rangesOnLines", () => {
  it("gives each line the stretches of the spans crossing it, and other lines none", () => {
    const on = rangesOnLines(substrate, [span(0, 22, 1, 2), span(2, 3, 2, 6)])
    expect(on(0)).toEqual([{ start: 22, end: 28 }])
    expect(on(1)).toEqual([{ start: 0, end: 2 }])
    expect(on(2)).toEqual([{ start: 3, end: 6 }])
    expect(on(5)).toEqual([])
  })
})
