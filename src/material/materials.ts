import type { Fingerprint, Poem, Span, Substrate } from "./types"

/** A text as everything else uses it: its lines, its words (spans in those lines, in the poem's
 * order), the lines' fingerprint, and the poem as it is shown. */
export interface Material {
  readonly substrate: Substrate
  readonly words: readonly Span[]
  readonly fingerprint: Fingerprint
  readonly poem: Poem
}

export type Materials = (text: string) => Material | null
