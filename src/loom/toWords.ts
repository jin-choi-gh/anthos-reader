import { comparePositions, spanProblem } from "../material/spans"
import type { Span } from "../material/types"
import { schemaOfKind, spanOf, substrateOf } from "./textualComplex"
import type { LoomTextualComplex } from "./types"

// The word-tokens schema's kind and its rank, as loom names them in
// loom/src/schemata/word_tokens.py.

export const WORD_TOKENS = "word-tokens"
export const WORD = "word"

/** The poem's words, as loom's word-tokens schema divides them, in the poem's order: each a span in
 * one line. A word that breaks the rule for spans, that runs over a line or is empty, or that
 * overlaps the word before it is left out. Every textual complex loom builds has a word-tokens
 * schema, made with its display schema; one with none, or with several, is refused, as
 * schemaOfKind refuses it. */
export function toWords(textualComplex: LoomTextualComplex): Span[] {
  const { schema } = schemaOfKind(textualComplex, WORD_TOKENS)
  const substrate = substrateOf(textualComplex)

  const spans = schema.units
    .filter((unit) => unit.rank === WORD)
    .map(spanOf)
    .filter(
      (span) =>
        spanProblem(substrate, span) === null &&
        span.start.line === span.end.line &&
        span.start.offset < span.end.offset,
    )
    .sort((a, b) => comparePositions(a.start, b.start))

  const words: Span[] = []
  for (const span of spans) {
    const last = words.at(-1)
    if (last !== undefined && comparePositions(span.start, last.end) < 0) continue
    words.push(span)
  }
  return words
}
