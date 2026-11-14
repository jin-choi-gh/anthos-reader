import type { Annotation, Fingerprint } from "../material/types"
import type { PracticeId } from "../practice/types"

/** A note's id: made once, when the note is written, and kept for good. Only the notebook makes one,
 * so a string from anywhere else cannot pass for it. */
export type NoteId = string & { readonly __brand: "NoteId" }

/** Where in a run a note was written: the practice, and the stage and step it was on. */
export interface Provenance {
  readonly practice: PracticeId
  readonly stage: number
  readonly step: number
}

/** A note as it stands now: an annotation of the reader's, with its latest body, the fingerprint of
 * the lines it was written on (its targets are positions in those lines), where in a run it was
 * written (null: outside a practice), and when. */
export interface ReaderNote extends Annotation {
  readonly id: NoteId
  readonly fingerprint: Fingerprint
  readonly from: Provenance | null
  readonly writtenAt: number
  readonly revisedAt: number | null
}

/** A note as the reader first writes it: everything but its id and its times, which the notebook
 * gives it. */
export type NewNote = Omit<ReaderNote, "id" | "writtenAt" | "revisedAt">

export type NotebookEvent =
  | ({ readonly kind: "noted"; readonly id: NoteId; readonly at: number } & NewNote)
  | { readonly kind: "revised"; readonly id: NoteId; readonly at: number; readonly body: string }
  | { readonly kind: "withdrawn"; readonly id: NoteId; readonly at: number }
