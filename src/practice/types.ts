// The reel: a practice as its editor writes it, frame by frame. Nothing here knows who watches it,
// or where they are in it. The rest at the end of each stage and the final stage are spliced in by
// the projector; the editor never writes them.

import type { TextId } from "../material/types"

/** A practice's id: "first-reading". With its text, it names the practice's runs. */
export type PracticeId = string

export interface Practice {
  readonly id: PracticeId
  readonly title: string
  readonly text: TextId
  readonly stages: readonly Stage[]
}

export interface Stage {
  readonly name: string
  readonly steps: readonly Step[]
}

/** A step, as the editor writes it: one direction. Only the lexicon reads which one it is. */
export type Step = ConsiderStep | RespondStep

export interface ConsiderStep {
  readonly direction: "consider"
  readonly note: string // a reference to the editor's note: "@angle-worm"
  readonly prose: readonly string[]
}

export interface RespondStep {
  readonly direction: "respond"
  readonly prose: readonly string[]
}

/** What a frame of the reel is made of, whatever its direction: the parts the screen draws. */
export interface Parts {
  /** The intertitle: the words in the praxis bar. */
  readonly prose: readonly string[]
  /** The iris: references to the editor's notes to pick out in the poem ("@angle-worm"). */
  readonly highlight: readonly string[]
  /** The notebook page: what the reader is asked to write, or null when nothing is asked. */
  readonly writing: Writing | null
}

/** What the reader is asked to write: for now, one note on the whole poem, which they may revise.
 * Observe will add notes on passages, as many as the reader likes. */
export interface Writing {
  readonly anchor: "whole"
  readonly count: "one"
}
