import type { Fingerprint, Notes, Poem, Substrate } from "./types"

/** A text as everything else uses it: its lines and their fingerprint, the poem as it is shown, and
 * the editor's notes. */
export interface Material {
  readonly substrate: Substrate
  readonly fingerprint: Fingerprint
  readonly poem: Poem
  readonly notes: Notes
}

export type Materials = (text: string) => Material | null
