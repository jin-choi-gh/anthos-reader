import type { Practice } from "../practice/types"
import { clearEvents, isRecord, readEvents, writeEvents } from "../storage/log"
import type { Event } from "./types"

// The projectionist's log: what happened in one screening of a practice on a text.

/** The key a run is kept under: one per practice and text. */
export function logKey(practice: Practice): string {
  return `anthos.log.${practice.id}.${practice.text}`
}

export function readLog(practice: Practice): Event[] {
  return readEvents(logKey(practice), isEvent)
}

export function writeLog(practice: Practice, log: readonly Event[]): boolean {
  return writeEvents(logKey(practice), log)
}

export function clearLog(practice: Practice): void {
  clearEvents(logKey(practice))
}

function isEvent(value: unknown): value is Event {
  if (!isRecord(value)) return false
  if (!Number.isInteger(value.stage) || typeof value.at !== "number") return false
  switch (value.kind) {
    case "visited":
      return Number.isInteger(value.step)
    case "finished":
      return typeof value.day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.day)
    default:
      return false // a kind this reader does not know, such as the "responded" of an older log
  }
}
