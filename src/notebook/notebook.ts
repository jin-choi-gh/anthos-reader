import { assertNever } from "../assertNever"
import type { NewNote, NoteId, NotebookEvent, Provenance, ReaderNote } from "./types"

/** The notebook as it stands: every note not withdrawn, in the order written, each with its latest
 * body. Events about a note the notebook does not have change nothing. */
export function notesOf(events: readonly NotebookEvent[]): ReaderNote[] {
  const notes = new Map<NoteId, ReaderNote>()
  for (const event of events) {
    switch (event.kind) {
      case "noted": {
        const { id, at, targets, tags, body, fingerprint, from } = event
        if (!notes.has(id))
          notes.set(id, {
            id,
            targets,
            tags,
            body,
            fingerprint,
            from,
            writtenAt: at,
            revisedAt: null,
          })
        break
      }
      case "revised": {
        const note = notes.get(event.id)
        if (note !== undefined)
          notes.set(event.id, { ...note, body: event.body, revisedAt: event.at })
        break
      }
      case "withdrawn":
        notes.delete(event.id)
        break
      default:
        assertNever(event)
    }
  }
  return [...notes.values()]
}

/** The notes written on one step of one practice. */
export function notesFrom(notes: readonly ReaderNote[], where: Provenance): ReaderNote[] {
  return notes.filter(
    ({ from }) =>
      from !== null &&
      from.practice === where.practice &&
      from.stage === where.stage &&
      from.step === where.step,
  )
}

/** The event that writes a new note. Its id and time come from outside, so this stays pure. A note
 * is about something, so it has at least one target. Only the fields of a note are kept. */
export function eventOfNoting(note: NewNote, stamp: { id: NoteId; at: number }): NotebookEvent {
  if (note.targets.length === 0) throw new RangeError("a note must be about something")
  const { targets, tags, body, fingerprint, from } = note
  return { kind: "noted", ...stamp, targets, tags, body: bodyOf(body), fingerprint, from }
}

/** The event that gives a note a new body. Only a note the notebook has can be revised. */
export function eventOfRevising(
  notes: readonly ReaderNote[],
  id: NoteId,
  body: string,
  at: number,
): NotebookEvent {
  if (!notes.some((note) => note.id === id)) throw new RangeError(`no note ${id} to revise`)
  return { kind: "revised", id, at, body: bodyOf(body) }
}

/** The event that withdraws a note. Only a note the notebook has can be withdrawn. */
export function eventOfWithdrawing(
  notes: readonly ReaderNote[],
  id: NoteId,
  at: number,
): NotebookEvent {
  if (!notes.some((note) => note.id === id)) throw new RangeError(`no note ${id} to withdraw`)
  return { kind: "withdrawn", id, at }
}

/** A note's body, without the blank space around it. A note says something, so it is never empty. */
function bodyOf(body: string): string {
  const trimmed = body.trim()
  if (trimmed === "") throw new RangeError("a note cannot be empty")
  return trimmed
}
