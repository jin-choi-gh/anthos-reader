import type { TextId } from "../material/types"
import { appendEvents, clearEvents, isRecord, readEvents } from "../storage/log"
import type { NotebookEvent, NoteId } from "./types"

/** The key a text's notebook is kept under. Entries of an older shape fail the guard and are left
 * unread; a shape whose notes must be carried over is kept under a new key. */
export function notebookKey(text: TextId): string {
  return `anthos.v1.notebook.${text}`
}

export function readNotebook(text: TextId): NotebookEvent[] {
  return readEvents(notebookKey(text), isNotebookEvent)
}

/** Adds events to a text's notebook. False when storage is off or full. */
export function appendNotebook(text: TextId, events: readonly NotebookEvent[]): boolean {
  return appendEvents(notebookKey(text), events)
}

/** Development only: forgets a text's notebook, and empties every open copy of it. Outside
 * development it does nothing: the notebook is kept for good. */
export function clearNotebook(text: TextId): void {
  if (!import.meta.env.DEV) return
  clearEvents(notebookKey(text))
}

function isNotebookEvent(value: unknown): value is NotebookEvent {
  if (!isRecord(value) || !isNoteId(value.id) || typeof value.at !== "number") return false
  switch (value.kind) {
    case "noted":
      return (
        isTargets(value.targets) &&
        Array.isArray(value.tags) &&
        value.tags.every((tag) => typeof tag === "string") &&
        typeof value.body === "string" &&
        typeof value.fingerprint === "string" &&
        (value.from === null || isProvenance(value.from))
      )
    case "revised": // one written before a revision could change the targets has none: unread
      return isTargets(value.targets) && typeof value.body === "string"
    case "withdrawn":
      return true
    default:
      return false // a kind this reader does not know
  }
}

function isNoteId(value: unknown): value is NoteId {
  return typeof value === "string" && value !== ""
}

/** A note's targets: at least one span. */
function isTargets(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0 && value.every(isSpan)
}

function isSpan(value: unknown): boolean {
  return isRecord(value) && isPosition(value.start) && isPosition(value.end)
}

function isPosition(value: unknown): boolean {
  return isRecord(value) && isCount(value.line) && isCount(value.offset)
}

/** A whole number, from 0. */
function isCount(value: unknown): boolean {
  return Number.isInteger(value) && (value as number) >= 0
}

function isProvenance(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.practice === "string" &&
    typeof value.fingerprint === "string" && // older notes, written before versions, have none
    Number.isInteger(value.stage) &&
    Number.isInteger(value.step)
  )
}
