import type { Fingerprint, Poem, Substrate } from "./types"

/** A text as everything else uses it: its lines and their fingerprint, and the poem as it is
 * shown. */
export interface Material {
  readonly substrate: Substrate
  readonly fingerprint: Fingerprint
  readonly poem: Poem
}

export type Materials = (text: string) => Material | null
