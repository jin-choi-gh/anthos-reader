import type { TextId } from "../material/types"
import { clearEvents, isRecord, readEvents, writeEvents } from "../storage/log"
import type { NotebookEvent, NoteId } from "./types"

/** The key a text's notebook is kept under. The "v1" names the events' shape, so that a later shape
 * can be kept under another key, and the old log read and carried over. */
export function notebookKey(text: TextId): string {
  return `anthos.v1.notebook.${text}`
}

export function readNotebook(text: TextId): NotebookEvent[] {
  return readEvents(notebookKey(text), isNotebookEvent)
}

export function writeNotebook(text: TextId, events: readonly NotebookEvent[]): boolean {
  return writeEvents(notebookKey(text), events)
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
        typeof value.body === "string" &&
        isRecord(value.anchor) &&
        value.anchor.kind === "whole" &&
        typeof value.anchor.text === "string" &&
        (value.from === null || isProvenance(value.from))
      )
    case "revised":
      return typeof value.body === "string"
    case "withdrawn":
      return true
    default:
      return false // a kind this reader does not know
  }
}

function isNoteId(value: unknown): value is NoteId {
  return typeof value === "string" && value !== ""
}

function isProvenance(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.practice === "string" &&
    Number.isInteger(value.stage) &&
    Number.isInteger(value.step)
  )
}
