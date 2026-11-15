import type { LemmaPart, Note, Notes, Span, Substrate, TextId } from "../../material/types"
import type { NoteId, ReaderNote } from "../../notebook/types"

/** What the scene plays: parts, with every reference already resolved. */
export interface Subject {
  /** Which step this is. A new key starts the scene afresh. The same key with a fresh subject keeps
   * the scene's state while something around it changes, such as the notebook. */
  readonly key: string
  readonly text: TextId
  readonly prose: readonly string[]
  readonly commentary: Commentary
  /** What the reader is asked to write, or null. */
  readonly writing: WritingSubject | null
  /** A new note on passages the reader chooses, or null: then no passage can be chosen. */
  readonly noting: NotingSubject | null
}

/** The notes a subject shows, from one set (the editor's, or the reader's): highlighted in the poem,
 * one opened by a tap ("marked"), or listed beside it ("listed"). */
export interface Commentary {
  /** The set the notes come from, with what each line's notes cover. */
  readonly set: Notes
  /** The notes shown: always notes of the set. */
  readonly notes: readonly Note[]
  readonly shown: "marked" | "listed"
  /** The reader's own notes the set shows, in its order, so that one can be withdrawn; null for the
   * editor's. */
  readonly written: readonly ReaderNote[] | null
}

/** What the reader is asked to write: what it is about, its tags, and what they have written here
 * already. */
export interface WritingSubject {
  readonly about: WritingAbout
  readonly tags: readonly string[]
  readonly count: "one"
  readonly written: readonly ReaderNote[]
}

/** What a note to write is about: targets fixed by the step (the whole poem), or passages the
 * reader chooses from these lines, from which each passage's lemma is made. */
export type WritingAbout =
  | { readonly kind: "fixed"; readonly targets: readonly Span[] }
  | { readonly kind: "chosen"; readonly substrate: Substrate }

/** A new note on passages the reader chooses from the poem: its lines, from which each passage's
 * lemma is made. */
export interface NotingSubject {
  readonly substrate: Substrate
  /** The tags the note is written with. */
  readonly tags: readonly string[]
}

/** What the frame tells the scene: it only ever speaks when its subject changes. */
export interface FrameProtocol {
  toScene: { kind: "subject"; subject: Subject }
}

/** What the viewer tells the commentary. */
export type CommentaryMessage =
  | { kind: "tapNote"; note: number } // the note at that place in the set
  | { kind: "closeNote" }
  | { kind: "deleteNote"; id: string } // the reader's own note with that id

export interface ViewerProtocol {
  toScene: CommentaryMessage | { kind: "choose"; span: Span } // a passage the reader chose, while choosing is on: for the part that chooses
}

/** What the praxis bar tells the writing. */
export type WritingMessage =
  | { kind: "draft"; text: string } // the reader typed
  | { kind: "submit" } // Respond
  | { kind: "edit" } // Edit: write again over what was written
  | { kind: "cancel" } // Cancel: keep what was written

/** What the praxis bar tells the noting. */
export type NotingMessage =
  | { kind: "noteDraft"; text: string } // the reader typed
  | { kind: "addNote" } // Add note

/** What the praxis bar tells the part that chooses passages: the writing, while its note is on
 * passages the reader chooses, or else the noting. */
export type PassageMessage =
  | { kind: "choosing"; on: boolean } // the toggle for choosing passages
  | { kind: "unchoose"; index: number } // −: the chosen target at that place in the table

export interface PraxisBarProtocol {
  toScene: WritingMessage | NotingMessage | PassageMessage
}

/** What the reader has written, sent out to the notebook: a new annotation, a revision, or a
 * withdrawal. For a new note, the mode adds the fingerprint and where it was written; the notebook
 * makes the id and the time. */
export type Effect =
  | { kind: "note"; targets: readonly Span[]; tags: readonly string[]; body: string }
  | { kind: "revise"; id: NoteId; targets: readonly Span[]; body: string }
  | { kind: "withdraw"; id: NoteId }

/** The commentary's share of what the viewer draws: the notes it shows, picked out ("marked") or
 * listed beside the poem ("listed"), and the open one. */
export type CommentaryProjection =
  | { kind: "marked"; text: TextId; notes: Notes; marked: number[]; open: number | null }
  | {
      kind: "listed"
      text: TextId
      notes: Notes
      shown: number[]
      open: number | null
      deletable: boolean // the reader's own notes, which can be deleted
    }

/** What the viewer draws: the commentary's share, whether choosing is on, and the chosen targets. */
export type ViewerProjection = CommentaryProjection & {
  choosing: boolean
  chosen: readonly Span[]
}

/** What the praxis bar draws between the frame's heading and its buttons: the prose, the writing,
 * and the noting. */
export interface PraxisBarProjection {
  prose: readonly string[]
  writing: WritingProjection | null
  noting: NotingProjection | null
}

/** Passages being chosen: whether choosing is on, and each chosen target's lemma, in the poem's
 * order. */
export interface PassagesProjection {
  choosing: boolean
  chosen: readonly LemmaPart[]
}

/** The noting: its passages, the draft, and whether the note may be added: only once the draft says
 * something. */
export interface NotingProjection extends PassagesProjection {
  draft: string
  canAdd: boolean
}

/** The writing: being written, with what may be done with it, and its passages when the reader
 * chooses them (null when the step fixes what it is about); or written, to be edited, with its
 * lemma when the reader chose its passages. */
export type WritingProjection =
  | {
      kind: "writing"
      draft: string
      canSubmit: boolean
      canCancel: boolean
      passages: PassagesProjection | null
    }
  | { kind: "written"; body: string; lemma: readonly LemmaPart[] | null }

/** The scene's answer to anything: its next state, and what it writes in the notebook. */
export interface Reply<State> {
  state: State
  effects: readonly Effect[]
}
