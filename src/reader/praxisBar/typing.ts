/** How fast a note disclosed types itself out, in characters (graphemes) a second. */
export const TYPING_CHARS_PER_SECOND = 45

/** How long a note disclosed waits before it starts to type: as long as the viewer takes to sweep
 * in the first of its words, so that the words are lit before the note is written out. */
export const TYPING_DELAY_MS = 600

/** How long after a note is shown whole a press is not taken, so that a quick second press, meant
 * to finish the note, does not disclose the next one, or leave the step, before it is read. */
export const GUARD_MS = 250

const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" })

/** A text's graphemes: what a reader counts as one character, so that a letter and its accent are
 * typed together. */
export function graphemesOf(text: string): string[] {
  return Array.from(segmenter.segment(text), ({ segment }) => segment)
}

/** How many graphemes a note's paragraphs have, all told. */
export function lengthOf(paragraphs: readonly string[]): number {
  return paragraphs.reduce((sum, paragraph) => sum + graphemesOf(paragraph).length, 0)
}

/** A note's paragraphs as far as they are typed: the first `typed` graphemes, counted across the
 * paragraphs, the last of them cut where the typing has reached, and those not yet reached left
 * out. A paragraph is begun only once a grapheme of it is typed. */
export function typedOf(paragraphs: readonly string[], typed: number): string[] {
  const shown: string[] = []
  let left = Math.max(0, typed)
  for (const paragraph of paragraphs) {
    if (left === 0) break
    const graphemes = graphemesOf(paragraph)
    shown.push(graphemes.slice(0, left).join(""))
    left -= Math.min(left, graphemes.length)
  }
  return shown
}

/** How many graphemes are typed `elapsed` milliseconds after a note is disclosed: none during the
 * delay, then TYPING_CHARS_PER_SECOND, never more than the note has. */
export function typedAfter(elapsed: number, length: number): number {
  const typing = elapsed - TYPING_DELAY_MS
  if (typing <= 0) return 0
  return Math.min(length, Math.floor((typing * TYPING_CHARS_PER_SECOND) / 1000))
}
