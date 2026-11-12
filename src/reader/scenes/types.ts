import type { Anchor, Note, TextId } from "../../material/types"
import type { NoteId, ReaderNote } from "../../notebook/types"

// The scene's contracts: what the frame hands it (the subject), what the viewer and the praxis bar
// tell it (messages), what it tells them to draw (projections), and what it sends out into the
// notebook (effects). Nothing here knows a practice, a position, or a direction.

/** One frame of the screening, or the viewing table, as the scene needs it: made of parts, with
 * every reference already resolved. */
export interface Subject {
  /** The frame number. A new key is a cut: the scene starts afresh. The same key with a fresh subject
   * is the image holding while something around it changes, such as the notebook. */
  readonly key: string
  readonly text: TextId
  /** The intertitle. */
  readonly prose: readonly string[]
  /** The editor's notes on the footage. */
  readonly commentary: Commentary
  /** The notebook page, when the reader is asked to write. */
  readonly writing: WritingSubject | null
}

/** The editor's notes, as the frame shows them: picked out in the poem by an iris, one opened by a
 * tap ("marked"), or all listed beside it, as at the viewing table ("listed"). */
export interface Commentary {
  readonly notes: readonly Note[]
  readonly shown: "marked" | "listed"
}

/** What the reader is asked to write, and what they have written here already. */
export interface WritingSubject {
  readonly anchor: Anchor
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

/** What the scene sends out of the screen: the spectator's pen, writing in the notebook. The mode
 * says where in the screening it was written; the notebook makes the id and the time. */
export type Effect =
  { kind: "note"; anchor: Anchor; body: string } | { kind: "revise"; id: NoteId; body: string }

export type ViewerProjection =
  | { kind: "marked"; text: TextId; marked: number[]; open: number | null }
  | { kind: "listed"; text: TextId; shown: number[]; open: number | null }

/** What the praxis bar draws between the frame's heading and its buttons: the intertitle, and the
 * notebook page. */
export interface PraxisBarProjection {
  prose: readonly string[]
  writing: WritingProjection | null
}

/** The notebook page: being written, with what may be done with it; or written, to be edited. */
export type WritingProjection =
  | { kind: "writing"; draft: string; canSubmit: boolean; canCancel: boolean }
  | { kind: "written"; body: string }

/** The scene's answer to anything: its next state, and what it writes in the notebook. */
export interface Reply<State> {
  state: State
  effects: readonly Effect[]
}
