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

/** A step, as the editor writes it: its parts, and nothing else. */
export type Step = Parts

/** What a step is made of. */
export interface Parts {
  readonly prose: readonly string[]
  readonly highlight: readonly EditorsNote[]
  readonly writing: Writing | null
  readonly recall: Recall | null
}

/** A note the editor writes in the step that shows it, as loom has one: its id ("bird-flies-1"),
 * which loom allows to hold only letters, digits, - and _; its notehead, where it is on the poem
 * ("l4 fellow && l4 raw"); its tags; and its body, paragraphs parted by blank lines. */
export interface EditorsNote {
  readonly id: string
  readonly notehead: string
  readonly tags: readonly string[]
  readonly body: string
}

/** One note, with the tags the step gives it, which the reader may revise: on the whole poem
 * ("whole"), or on passages the reader chooses ("chosen"). */
export interface Writing {
  readonly target: "whole" | "chosen"
  readonly tags: readonly string[]
  readonly count: "one"
}

/** The reader's notes to bring back, as they answered the practice: those written in the stage
 * before ("previous"), or in every stage before ("all"), which in the final stage is the whole
 * practice. */
export interface Recall {
  readonly from: "previous" | "all"
}
