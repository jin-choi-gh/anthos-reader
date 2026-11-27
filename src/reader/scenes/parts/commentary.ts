import { assertNever } from "../../../assertNever"
import type { TextId } from "../../../material/types"
import type {
  Commentary,
  CommentaryMessage,
  CommentaryProjection,
  DisclosureMessage,
  DisclosureProjection,
  Effect,
} from "../types"

/** The open note: its place in the set, for drawing, and its id, by which it is followed when the
 * set changes; null when the note has none, and it is followed by its place. */
export interface OpenNote {
  readonly index: number
  readonly id: string | null
}

/** What the reader does to the commentary. A tap opens a note, or closes it if it is open; a tap on
 * a note the commentary does not show changes nothing. The X closes the open note; the list has
 * none. Notes disclosed are opened only from the praxis bar: a tap or the X changes nothing. Deleting one of the reader's own notes closes the open note and sends out the note's
 * withdrawal; an id the commentary does not carry changes nothing. What changes nothing gives back
 * the very same open note. */
export function onViewer(
  commentary: Commentary,
  open: OpenNote | null,
  message: CommentaryMessage,
): { open: OpenNote | null; effects: readonly Effect[] } {
  if (commentary.shown === "disclosed" && message.kind !== "deleteNote")
    return { open, effects: [] }
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
  switch (commentary.shown) {
    case "marked":
      return { kind: "marked", text, notes, marked: indexes, open: at }
    case "listed":
      return {
        kind: "listed",
        text,
        notes,
        shown: indexes,
        open: at,
        deletable: commentary.written !== null,
        recalled: commentary.recalled,
      }
    case "disclosed":
      return { kind: "disclosed", text, notes, open: at }
    default:
      return assertNever(commentary.shown)
  }
}

/** Notes being disclosed: how many of the commentary's notes are disclosed, in its order, and the
 * open note, the one being read. */
export interface Disclosure {
  readonly disclosed: number
  readonly open: OpenNote | null
}

/** The disclosure at the start: of notes disclosed already, every one, with the first open; of notes
 * still to disclose, none, and none open; of notes not disclosed one by one, none. */
export function startDisclosure(commentary: Commentary): Disclosure {
  const [first] = commentary.notes
  if (commentary.shown !== "disclosed" || commentary.disclosed !== true || first === undefined) {
    return { disclosed: 0, open: null }
  }
  return { disclosed: commentary.notes.length, open: { index: first.index, id: first.id } }
}

/** The disclosure once the frame has a fresh commentary for the same step, from the one it had
 * `before`, the open note already followed by its id (keepOpen). The same notes, as after a new day
 * or a note written elsewhere, are left as the reader has them. Notes disclosed since, here or in
 * another tab, are every one disclosed, the open note kept, or else the first opened. Anything else,
 * as notes no longer disclosed, or other notes, starts afresh. */
export function keepDisclosure(
  before: Commentary,
  commentary: Commentary,
  disclosure: Disclosure,
): Disclosure {
  if (commentary.shown !== "disclosed") return { disclosed: 0, open: disclosure.open }
  const notes = commentary.notes.length
  if (before.shown !== "disclosed" || before.notes.length !== notes) {
    return startDisclosure(commentary)
  }
  if (before.disclosed === commentary.disclosed) return disclosure
  if (commentary.disclosed !== true) return startDisclosure(commentary)
  return { disclosed: notes, open: disclosure.open ?? startDisclosure(commentary).open }
}

/** What the praxis bar does to notes disclosed. Disclose discloses the next note, in the
 * commentary's order, and opens it; disclosing the last sends out that every note is disclosed,
 * unless they were disclosed already; with none left, it changes nothing. Turn opens a note already
 * disclosed; one not yet disclosed, or not shown, or open already, changes nothing. Notes not
 * disclosed one by one change nothing. What changes nothing gives back the very same disclosure. */
export function onDisclosure(
  commentary: Commentary,
  disclosure: Disclosure,
  message: DisclosureMessage,
): { disclosure: Disclosure; effects: readonly Effect[] } {
  const unchanged = { disclosure, effects: [] }
  if (commentary.shown !== "disclosed") return unchanged
  switch (message.kind) {
    case "disclose": {
      const note = commentary.notes[disclosure.disclosed]
      if (note === undefined) return unchanged
      const disclosed = disclosure.disclosed + 1
      const last = disclosed === commentary.notes.length && commentary.disclosed !== true
      return {
        disclosure: { disclosed, open: { index: note.index, id: note.id } },
        effects: last ? [{ kind: "disclosed" }] : [],
      }
    }
    case "turn": {
      const place = commentary.notes.findIndex((note) => note.index === message.note)
      const note = commentary.notes[place]
      if (note === undefined || place >= disclosure.disclosed) return unchanged
      if (disclosure.open?.index === note.index) return unchanged
      return {
        disclosure: { ...disclosure, open: { index: note.index, id: note.id } },
        effects: [],
      }
    }
    default:
      return assertNever(message)
  }
}

/** The notes disclosed, for the praxis bar, under the subject's key: each disclosed note, in order,
 * with its place in the set, its lemma and its paragraphs; which of them is open, by its place among
 * them; whether more are to come; and how many there are in all. Null for notes not disclosed one by
 * one, or none at all. */
export function disclosureOf(
  key: string,
  commentary: Commentary,
  disclosure: Disclosure,
): DisclosureProjection | null {
  if (commentary.shown !== "disclosed" || commentary.notes.length === 0) return null
  const notes = commentary.notes
    .slice(0, disclosure.disclosed)
    .map(({ index, lemma, paragraphs }) => ({ index, lemma, paragraphs }))
  const current = notes.findIndex((note) => note.index === disclosure.open?.index)
  return {
    key,
    notes,
    current: current === -1 ? null : current,
    more: disclosure.disclosed < commentary.notes.length,
    count: commentary.notes.length,
  }
}
