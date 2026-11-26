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

/** A stage's id, which never changes: "stage-1". Letters, digits, - and _, as loom allows ids. */
export type StageId = string

/** A step's id, which never changes: "step-4". Letters, digits, - and _, as loom allows ids. */
export type StepId = string

/** A group of steps: its id, its name, which heads its steps, its steps, and its days: how many
 * days after the reader finishes the stage before it opens, at least 1, or null on the first
 * stage, which is open from the start. */
export interface Stage {
  readonly id: StageId
  readonly name: string
  readonly days: number | null
  readonly steps: readonly Step[]
}

/** A step, as the editor writes it: its parts, under an id that names it, and nothing else. */
export interface Step extends Parts {
  readonly id: StepId
}

/** What a step is made of. */
export interface Parts {
  readonly prose: readonly string[]
  readonly highlight: readonly EditorsNote[]
  readonly writing: Writing | null
  readonly recall: Recall | null
  readonly restore: Restore | null
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

/** Words or lines of the poem to take out and give the reader to put back: which of the two the
 * step takes out (of), and its gaps, each a notehead with one target, one of the poem's words
 * ("l3 Angle", "l1 the[2]") or a whole line ("l8"). */
export interface Restore {
  readonly of: "words" | "lines"
  readonly gaps: readonly string[]
}

/** The reader's notes to bring back, as they answered the practice: those written in an earlier
 * stage ("stage"), or on an earlier step ("step"), named by its id; or, in the final stage only,
 * those written in every stage before it, the whole practice ("all"). */
export type Recall =
  | { readonly from: "stage"; readonly id: StageId }
  | { readonly from: "step"; readonly id: StepId }
  | { readonly from: "all" }
