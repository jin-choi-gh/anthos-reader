import { assertNever } from "../../../assertNever"
import type { TextId } from "../../../material/types"
import type { Commentary, CommentaryMessage, CommentaryProjection, Effect } from "../types"

/** The open note: its place in the set, for drawing, and its id, by which it is followed when the
 * set changes; null when the note has none, and it is followed by its place. */
export interface OpenNote {
  readonly index: number
  readonly id: string | null
}

/** What the reader does to the commentary. A tap opens a note, or closes it if it is open; a tap on
 * a note the commentary does not show changes nothing. The X closes the open note; the list has
 * none. Deleting one of the reader's own notes closes the open note and sends out the note's
 * withdrawal; an id the commentary does not carry changes nothing. What changes nothing gives back
 * the very same open note. */
export function onViewer(
  commentary: Commentary,
  open: OpenNote | null,
  message: CommentaryMessage,
): { open: OpenNote | null; effects: readonly Effect[] } {
  switch (message.kind) {
    case "tapNote": {
      const note = commentary.notes.find((shown) => shown.index === message.note)
      if (note === undefined) return { open, effects: [] }
      if (open?.index === message.note) return { open: null, effects: [] }
      return { open: { index: note.index, id: note.id }, effects: [] }
    }
    case "closeNote":
      return { open: commentary.shown === "listed" ? open : null, effects: [] }
    case "deleteNote": {
      const note = commentary.written?.find((written) => written.id === message.id)
      if (note === undefined) return { open, effects: [] }
      return { open: null, effects: [{ kind: "withdraw", id: note.id }] }
    }
    default:
      return assertNever(message)
  }
}

/** The open note, once the commentary is fresh: the note with its id, wherever it now is, or closed
 * if it is gone; a note without an id stays open at its place if that is still shown. Unchanged, it
 * is the very same open note. */
export function keepOpen(commentary: Commentary, open: OpenNote | null): OpenNote | null {
  if (open === null) return null
  const note =
    open.id === null
      ? commentary.notes.find((shown) => shown.index === open.index)
      : commentary.notes.find((shown) => shown.id === open.id)
  if (note === undefined) return null
  return note.index === open.index ? open : { index: note.index, id: note.id }
}

/** What the viewer draws: the set the notes come from, the notes picked out in the poem or listed
 * beside it, the open one, and, listed, whether they can be deleted and, for notes recalled, what
 * each answered. */
export function viewerOf(
  text: TextId,
  commentary: Commentary,
  open: OpenNote | null,
): CommentaryProjection {
  const notes = commentary.set
  const indexes = commentary.notes.map((note) => note.index)
  const at = open?.index ?? null
  return commentary.shown === "marked"
    ? { kind: "marked", text, notes, marked: indexes, open: at }
    : {
        kind: "listed",
        text,
        notes,
        shown: indexes,
        open: at,
        deletable: commentary.written !== null,
        recalled: commentary.recalled,
      }
}
