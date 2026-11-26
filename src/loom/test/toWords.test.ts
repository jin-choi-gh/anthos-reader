import { describe, expect, it } from "vitest"
import { textOf } from "../../material/spans"
import type { Span } from "../../material/types"
import { substrateOf } from "../textualComplex"
import { toWords, WORD, WORD_TOKENS } from "../toWords"
import type { LoomPosition, LoomTextualComplex, LoomUnit } from "../types"
import { makeTextualComplex } from "./fixture"

const stanzas = [
  ["A Bird, came down the Walk -", "He did not know I saw -"],
  ["o'er Love's sickle"],
]

/** The text of each word, as the poem has it. */
const textsOf = (complex: LoomTextualComplex, words: readonly Span[]) =>
  words.map((word) => textOf(substrateOf(complex), word))

/** A textual complex whose word-tokens schema has exactly these words. */
function withWords(...words: [LoomPosition, LoomPosition][]): LoomTextualComplex {
  const complex = makeTextualComplex(stanzas)
  const units: LoomUnit[] = words.map(([start, end], i) => ({
    id: `w${i + 1}`,
    rank: WORD,
    value: null,
    parent: null,
    start,
    end,
  }))
  return {
    ...complex,
    schemata: { ...complex.schemata, "word-tokens": { kind: WORD_TOKENS, units } },
  }
}

/** A word from one position to another: line and offset, then line and offset. */
const word = (a: number, b: number, c: number, d: number): [LoomPosition, LoomPosition] => [
  [a, b],
  [c, d],
]

describe("toWords", () => {
  it("gives the poem's words in its order, with no punctuation at either end", () => {
    const complex = makeTextualComplex(stanzas)
    expect(textsOf(complex, toWords(complex))).toEqual([
      ...["A", "Bird", "came", "down", "the", "Walk"],
      ...["He", "did", "not", "know", "I", "saw"],
      ...["o'er", "Love's", "sickle"],
    ])
  })

  it("gives each word as a span in one line", () => {
    const complex = makeTextualComplex(stanzas)
    expect(toWords(complex)[1]).toEqual({
      start: { line: 0, offset: 2 },
      end: { line: 0, offset: 6 },
    })
  })

  it("refuses a textual complex with no word-tokens schema", () => {
    const { "word-tokens": _tokens, ...schemata } = makeTextualComplex(stanzas).schemata
    const complex = { ...makeTextualComplex(stanzas), schemata }
    expect(() => toWords(complex)).toThrow("fixture: no word-tokens schema")
  })

  it("puts the words in the poem's order, whatever order loom lists them in", () => {
    const complex = withWords(word(1, 0, 1, 2), word(0, 2, 0, 6))
    expect(textsOf(complex, toWords(complex))).toEqual(["Bird", "He"])
  })

  it("leaves out a word that breaks the rule for spans, runs over a line, or is empty", () => {
    const bird = word(0, 2, 0, 6)
    const pastTheEnd = word(0, 30, 0, 32)
    const backwards = word(0, 8, 0, 4)
    const overALine = word(0, 22, 1, 2)
    const empty = word(1, 3, 1, 3)
    const complex = withWords(bird, pastTheEnd, backwards, overALine, empty)
    expect(textsOf(complex, toWords(complex))).toEqual(["Bird"])
  })

  it("leaves out a word that overlaps the word before it", () => {
    const complex = withWords(word(0, 2, 0, 6), word(0, 4, 0, 11), word(0, 8, 0, 12))
    expect(textsOf(complex, toWords(complex))).toEqual(["Bird", "came"])
  })

  it("refuses a textual complex with several word-tokens schemata", () => {
    const complex = withWords(word(0, 2, 0, 6))
    const twice = {
      ...complex,
      schemata: { ...complex.schemata, again: complex.schemata["word-tokens"]! },
    }
    expect(() => toWords(twice)).toThrow("several word-tokens schemata")
  })
})
