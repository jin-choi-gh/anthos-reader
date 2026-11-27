import { describe, expect, it } from "vitest"
import {
  graphemesOf,
  lengthOf,
  TYPING_CHARS_PER_SECOND,
  TYPING_DELAY_MS,
  typedAfter,
  typedOf,
} from "../typing"

describe("typedOf: a note's paragraphs as far as they are typed", () => {
  const note = ["The bird.", "Its flight."]

  it("types nothing at first, and the whole note at its length", () => {
    expect(typedOf(note, 0)).toEqual([])
    expect(typedOf(note, lengthOf(note))).toEqual(note)
    expect(typedOf(note, lengthOf(note) + 5)).toEqual(note)
  })

  it("cuts the paragraph the typing has reached, and leaves out those it has not", () => {
    expect(typedOf(note, 3)).toEqual(["The"])
    expect(typedOf(note, 9)).toEqual(["The bird."])
    expect(typedOf(note, 12)).toEqual(["The bird.", "Its"])
  })

  it("types a letter and its accent together, as one character", () => {
    const accented = ["Café au lait"] // "é" as e and a combining accent
    expect(graphemesOf(accented[0]!)).toHaveLength(12)
    expect(typedOf(accented, 4)).toEqual(["Café"])
  })
})

describe("typedAfter: how far a note is typed, a while after it is disclosed", () => {
  it("types nothing while the words are swept in, then at its speed, up to the note's length", () => {
    expect(typedAfter(0, 100)).toBe(0)
    expect(typedAfter(TYPING_DELAY_MS, 100)).toBe(0)
    expect(typedAfter(TYPING_DELAY_MS + 1000, 100)).toBe(TYPING_CHARS_PER_SECOND)
    expect(typedAfter(TYPING_DELAY_MS + 60_000, 100)).toBe(100)
  })
})
