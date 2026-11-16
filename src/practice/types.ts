import type { TextId } from "../material/types"

/** A practice's id: "first-reading". With its text and its fingerprint, it names the practice's
 * runs. */
export type PracticeId = string

/** A hash of a practice's steps: the same steps always give the same fingerprint, and any change to
 * a step almost surely another, a new version of the practice. Only fingerprintOfPractice makes one,
 * so it is never taken for a text's fingerprint. */
export type PracticeFingerprint = string & { readonly __brand: "PracticeFingerprint" }

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
export type Step = ConsiderStep | RespondStep | ObserveStep | RecallStep

export interface ConsiderStep {
  readonly direction: "consider"
  readonly note: string // a reference to the editor's note: "@angle-worm"
  readonly prose: readonly string[]
}

export interface RespondStep {
  readonly direction: "respond"
  readonly prose: readonly string[]
}

export interface ObserveStep {
  readonly direction: "observe"
  readonly prose: readonly string[]
}

export interface RecallStep {
  readonly direction: "recall"
  readonly prose: readonly string[]
}

/** What a step is made of, whatever its direction. */
export interface Parts {
  /** The step's words. */
  readonly prose: readonly string[]
  /** References to the editor's notes to highlight in the poem: "@angle-worm". */
  readonly highlight: readonly string[]
  /** What the reader is asked to write, or null when nothing is asked. */
  readonly writing: Writing | null
  /** The reader's own notes to bring back, or null when none are. */
  readonly recall: Recall | null
}

/** One note, with the tags the step gives it, which the reader may revise: on the whole poem
 * ("whole"), or on passages the reader chooses ("chosen"). */
export interface Writing {
  readonly target: "whole" | "chosen"
  readonly tags: readonly string[]
  readonly count: "one"
}

/** The reader's notes to bring back, as they answered the practice: those written in the stage
 * before. */
export interface Recall {
  readonly from: "previous"
}
