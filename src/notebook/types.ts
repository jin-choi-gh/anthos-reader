// The spectator's notebook: what the reader writes about a text, kept as events, one notebook per
// text. It outlives any screening: notes written in a practice and at the viewing table (annotate
// mode) are all kept here, each saying where it was written.

import type { Anchor } from "../material/types"
import type { PracticeId } from "../practice/types"

/** A note's id: made once, when the note is written, and kept for good. Only the notebook makes one,
 * so a string from anywhere else cannot pass for it. */
export type NoteId = string & { readonly __brand: "NoteId" }

/** Where in a screening a note was written: the practice, and the stage and step it was on. */
export interface Provenance {
  readonly practice: PracticeId
  readonly stage: number
  readonly step: number
}

export type NotebookEvent =
  | {
      readonly kind: "noted"
      readonly id: NoteId
      readonly at: number
      readonly anchor: Anchor
      readonly body: string
      readonly from: Provenance | null // null: written at the viewing table
    }
  | { readonly kind: "revised"; readonly id: NoteId; readonly at: number; readonly body: string }
  | { readonly kind: "withdrawn"; readonly id: NoteId; readonly at: number }

/** A note as it stands now: its latest body, where it is pinned and where it was written, and when. */
export interface ReaderNote {
  readonly id: NoteId
  readonly anchor: Anchor
  readonly body: string
  readonly from: Provenance | null
  readonly writtenAt: number
  readonly revisedAt: number | null
}
