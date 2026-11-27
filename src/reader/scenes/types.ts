import type { LemmaPart, Note, Notes, Span, Substrate, TextId } from "../../material/types"
import type { NoteId, ReaderNote } from "../../notebook/types"

/** What the scene plays: parts, with every notehead already placed. */
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
  /** Words or lines taken out of the poem, for the reader to put back, or null. */
  readonly restore: RestoreSubject | null
  /** In Form Practice, the poem's words or lines, each to pick, or null. */
  readonly picking: PickingSubject | null
}

/** In Form Practice, for a step that restores: what it takes out, words or lines, and each of the
 * poem's words, or each of its lines, in the poem's order, to pick, with whether a gap of the step
 * takes it out. */
export interface PickingSubject {
  readonly of: "words" | "lines"
  readonly units: readonly PickUnit[]
}

/** A word or a line to pick: where it is, and whether a gap takes it out. */
export interface PickUnit {
  readonly span: Span
  readonly taken: boolean
}

/** Words or lines taken out of the poem: which of the two; the gaps, in the poem's order; the
 * slips, the gaps' texts in the order they lie for the reader; and whether the step is restored
 * already, as it is when the reader comes back to it: then every gap starts restored. */
export interface RestoreSubject {
  readonly of: "words" | "lines"
  readonly gaps: readonly Gap[]
  readonly slips: readonly string[]
  readonly restored: boolean
}

/** A gap: where it is in the poem, and the text it takes out, which is what a slip must carry to
 * fit it. */
export interface Gap {
  readonly span: Span
  readonly text: string
}

/** The notes a subject shows, from one set (the editor's, or the reader's): picked out in the poem,
 * one opened by a tap ("marked"); listed beside it ("listed"); or disclosed one by one, in the set's
 * order, by the praxis bar, the one being read picked out in the poem ("disclosed"). */
export interface Commentary {
  /** The set the notes come from, with what each line's notes cover. */
  readonly set: Notes
  /** The notes shown: always notes of the set. */
  readonly notes: readonly Note[]
  readonly shown: "marked" | "listed" | "disclosed"
  /** The reader's own notes the set shows, in its order, so that one can be withdrawn; null when
   * none may be, as for the editor's notes and for notes recalled. */
  readonly written: readonly ReaderNote[] | null
  /** For notes recalled, one for each note of the set, in its order: what each answered, and
   * whether it is on the whole poem; null for other notes. */
  readonly recalled: readonly Recalled[] | null
  /** For notes disclosed, whether every one is disclosed already, as when the reader comes back to
   * the step: then all are disclosed from the start, and the first is open; null for other notes. */
  readonly disclosed: boolean | null
}

/** A note recalled: the words of the step it answered (its prompt); whether it is on the whole
 * poem, whose lemma then says nothing worth showing; and, on the first note of each stage, the
 * stage's name, as a heading (null on the others). */
export interface Recalled {
  readonly prompt: readonly string[]
  readonly whole: boolean
  readonly heading: string | null
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

/** What the viewer tells the restore. */
export type GapMessage = { kind: "empty"; gap: number } // a filled gap tapped: its slip goes back

/** What the viewer tells the picking. */
export type PickMessage = { kind: "pick"; unit: number } // the word or line at that place, picked

export interface ViewerProtocol {
  toScene: CommentaryMessage | GapMessage | PickMessage | { kind: "choose"; span: Span } // a passage the reader chose, while choosing is on: for the part that chooses
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
  | { kind: "takeUp"; targets: readonly Span[]; text: string } // a note taken in hand, to write again

/** What the praxis bar tells the part that chooses passages: the writing, while its note is on
 * passages the reader chooses, or else the noting. */
export type PassageMessage =
  | { kind: "choosing"; on: boolean } // the toggle for choosing passages
  | { kind: "unchoose"; index: number } // −: the chosen target at that place in the table

/** What the praxis bar tells the commentary, of notes disclosed. */
export type DisclosureMessage =
  | { kind: "disclose" } // the next note, disclosed and opened
  | { kind: "turn"; note: number } // a note already disclosed, by its place in the set, opened

/** What the praxis bar tells the restore. */
export type RestoreMessage =
  | { kind: "take"; slip: number } // the slip at that place in the tray, into the first empty gap
  | { kind: "check" } // Check: every gap filled

export interface PraxisBarProtocol {
  toScene: WritingMessage | NotingMessage | PassageMessage | DisclosureMessage | RestoreMessage
}

/** What the scene sends out for the mode to keep: for the notebook, what the reader has written, a
 * new annotation, a revision, or a withdrawal; for the run's log, that every gap of the step is
 * restored, or that every note of it is disclosed; for Form Practice, a word or line picked, by its
 * span. For a new note, the mode adds the fingerprint and where it was written; the notebook makes
 * the id and the time. */
export type Effect =
  | { kind: "note"; targets: readonly Span[]; tags: readonly string[]; body: string }
  | { kind: "revise"; id: NoteId; targets: readonly Span[]; body: string }
  | { kind: "withdraw"; id: NoteId }
  | { kind: "restored" }
  | { kind: "disclosed" }
  | { kind: "pick"; span: Span }

/** The commentary's share of what the viewer draws: the notes it shows, picked out ("marked"),
 * listed beside the poem ("listed"), or disclosed, of which only the open one, the one being read,
 * is picked out ("disclosed"); and the open one. */
export type CommentaryProjection =
  | { kind: "marked"; text: TextId; notes: Notes; marked: number[]; open: number | null }
  | {
      kind: "listed"
      text: TextId
      notes: Notes
      shown: number[]
      open: number | null
      deletable: boolean // the reader's own notes, which can be deleted
      recalled: readonly Recalled[] | null // for notes recalled, by their place in the set
    }
  | { kind: "disclosed"; text: TextId; notes: Notes; open: number | null }

/** What the viewer draws: the commentary's share, whether choosing is on, the chosen targets, the
 * restore's gaps, and, in Form Practice, the words or lines to pick. */
export type ViewerProjection = CommentaryProjection & {
  choosing: boolean
  chosen: readonly Span[]
  restore: GapsProjection | null
  picking: PickingProjection | null
}

/** The words or lines to pick, for the viewer, each with whether a gap takes it out. */
export interface PickingProjection {
  of: "words" | "lines"
  units: readonly PickUnit[]
}

/** The restore's gaps, for the viewer: whether they are words or lines, the gap the next slip fills
 * (null when none is empty), and each gap, in the poem's order: empty, with no text, for the text it
 * takes out is never drawn until it is restored; filled, with the text of the slip in it, right or
 * wrong; or restored, with the poem's own text. */
export interface GapsProjection {
  of: "words" | "lines"
  next: number | null
  gaps: readonly GapProjection[]
}

export type GapProjection =
  | { state: "empty"; span: Span }
  | { state: "filled"; span: Span; text: string }
  | { state: "restored"; span: Span; text: string }

/** What a subject asks of the reader besides its prose, from its parts: to write; to look back at
 * the notes it recalls; to restore the poem; to read the editor's notes as they are disclosed; or
 * only to read. With a noting, as in annotate mode, or a picking, it asks nothing: null. */
export type Asks = "read" | "disclose" | "write" | "recall" | "restore" | null

/** What the praxis bar draws between the frame's heading and its buttons: the prose, the writing,
 * the noting, the notes disclosed, and the restore's slips. */
export interface PraxisBarProjection {
  asks: Asks
  prose: readonly string[]
  writing: WritingProjection | null
  noting: NotingProjection | null
  disclosure: DisclosureProjection | null
  restore: SlipsProjection | null
}

/** The notes disclosed, for the praxis bar: the subject's key, so that what it draws starts afresh on
 * another step; each note disclosed, in the order disclosed, with its place in the set, its lemma and
 * its paragraphs; which of them is open, the one being read, by its place among them (null before
 * the first is disclosed); whether more are to come; and how many the step has in all, which decides
 * only how they are drawn, never what the reader is told. */
export interface DisclosureProjection {
  key: string
  notes: readonly DisclosedNote[]
  current: number | null
  more: boolean
  count: number
}

/** A note disclosed: its place in the set, its lemma and its paragraphs. */
export interface DisclosedNote {
  index: number
  lemma: readonly LemmaPart[]
  paragraphs: readonly string[]
}

/** The restore's slips, for the praxis bar: whether they are words or lines; every slip, in the
 * order it lies, whether it is in a gap, and whether it is matched there, its gap restored; whether Check may be pressed, as it may once every gap
 * is filled and the poem is not yet whole; how many gaps are restored, of how many; how many slips
 * the last check gave back, until the reader moves a slip again (null otherwise); and whether the
 * poem is whole, every gap restored. */
export interface SlipsProjection {
  of: "words" | "lines"
  slips: readonly { text: string; placed: boolean; restored: boolean }[]
  canCheck: boolean
  restored: number
  gaps: number
  returned: number | null
  whole: boolean
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

/** The scene's answer to anything: its next state, and what it sends out for the mode to keep. */
export interface Reply<State> {
  state: State
  effects: readonly Effect[]
}
