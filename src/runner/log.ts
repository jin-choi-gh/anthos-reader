import type { Practice } from "../practice/types"
import { appendEvents, clearEvents, isRecord, readEvents } from "../storage/log"
import type { Event } from "./types"

/** The key a run is kept under: one per practice and text. */
export function logKey(practice: Practice): string {
  return `anthos.log.${practice.id}.${practice.text}`
}

export function readLog(practice: Practice): Event[] {
  return readEvents(logKey(practice), isEvent)
}

/** Adds events to a run's log. False when storage is off or full. */
export function appendLog(practice: Practice, events: readonly Event[]): boolean {
  return appendEvents(logKey(practice), events)
}

/** Development only: forgets a run, and empties every open copy of it. Outside development it does
 * nothing. */
export function clearLog(practice: Practice): void {
  if (!import.meta.env.DEV) return
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
