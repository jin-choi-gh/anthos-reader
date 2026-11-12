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

/** A step, as the editor writes it: one direction. */
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

/** What a step is made of, whatever its direction. */
export interface Parts {
  /** Words for the praxis bar. */
  readonly prose: readonly string[]
  /** References to the editor's notes to highlight in the poem: "@angle-worm". */
  readonly highlight: readonly string[]
  /** What the reader is asked to write, or null when nothing is asked. */
  readonly writing: Writing | null
}

/** For now, one note on the whole poem, which the reader may revise. */
export interface Writing {
  readonly anchor: "whole"
  readonly count: "one"
}
