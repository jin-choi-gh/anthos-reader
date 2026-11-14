import type { Note, Span, TextId } from "../../material/types"
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
}

/** The editor's notes: highlighted in the poem, one opened by a tap ("marked"), or all listed beside
 * it ("listed"). */
export interface Commentary {
  readonly notes: readonly Note[]
  readonly shown: "marked" | "listed"
}

/** What the reader is asked to write: what it is about, its tags, and what they have written here
 * already. */
export interface WritingSubject {
  readonly targets: readonly Span[]
  readonly tags: readonly string[]
  readonly count: "one"
  readonly written: readonly ReaderNote[]
}

/** What the frame tells the scene: it only ever speaks when its subject changes. */
export interface FrameProtocol {
  toScene: { kind: "subject"; subject: Subject }
}

export interface ViewerProtocol {
  toScene: { kind: "tapNote"; note: number } | { kind: "closeNote" }
}

export interface PraxisBarProtocol {
  toScene:
    | { kind: "draft"; text: string } // the reader typed
    | { kind: "submit" } // Respond
    | { kind: "edit" } // Edit: write again over what was written
    | { kind: "cancel" } // Cancel: keep what was written
}

/** What the reader has written, sent out to the notebook: a new annotation, or a revision. The mode
 * adds the fingerprint and where it was written; the notebook makes the id and the time. */
export type Effect =
  | { kind: "note"; targets: readonly Span[]; tags: readonly string[]; body: string }
  | { kind: "revise"; id: NoteId; body: string }

export type ViewerProjection =
  | { kind: "marked"; text: TextId; marked: number[]; open: number | null }
  | { kind: "listed"; text: TextId; shown: number[]; open: number | null }

/** What the praxis bar draws between the frame's heading and its buttons: the prose, and the
 * writing. */
export interface PraxisBarProjection {
  prose: readonly string[]
  writing: WritingProjection | null
}

/** The writing: being written, with what may be done with it; or written, to be edited. */
export type WritingProjection =
  | { kind: "writing"; draft: string; canSubmit: boolean; canCancel: boolean }
  | { kind: "written"; body: string }

/** The scene's answer to anything: its next state, and what it writes in the notebook. */
export interface Reply<State> {
  state: State
  effects: readonly Effect[]
}
