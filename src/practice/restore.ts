import { spansOfNotehead } from "../material/noteheads"
import { comparePositions, textOf } from "../material/spans"
import type { Span, Substrate } from "../material/types"
import type { Restore } from "./types"

/** A gap of a restore, placed on the poem: its place among the restore's gaps (`index`), as the
 * practice writes them, its notehead, where it is, and the text it takes out. */
export interface PlacedGap {
  readonly index: number
  readonly notehead: string
  readonly span: Span
  readonly text: string
}

/** A restore's gaps, placed on these lines by their noteheads, in the poem's order, however the
 * practice writes them, each with the text it takes out. A gap that cannot be placed, which
 * problemsOf refuses, is left out, and one whose notehead places more than one passage is taken as
 * its first. For the frame and for Form Practice. */
export function gapsOf(substrate: Substrate, restore: Restore): PlacedGap[] {
  return restore.gaps
    .flatMap((notehead, index) => {
      const placed = spansOfNotehead(substrate, notehead)
      const [span] = "spans" in placed ? placed.spans : []
      return span === undefined ? [] : [{ index, notehead, span, text: textOf(substrate, span) }]
    })
    .sort((a, b) => comparePositions(a.span.start, b.span.start))
}

// Alphabetical, as a reader would look a word up, the same in every browser
const ALPHABETICAL = new Intl.Collator("en", { sensitivity: "base", numeric: true })

/** The slips for these texts, in the order the reader is given them: alphabetical, so that the
 * order is the same on every visit and says nothing of where each belongs. Texts that differ only in
 * case or accents come in the order of their code points, so that the order is always the same. For
 * the frame and for Form Practice. */
export function slipsOf(texts: readonly string[]): string[] {
  return [...texts].sort((a, b) => ALPHABETICAL.compare(a, b) || (a < b ? -1 : a > b ? 1 : 0))
}
