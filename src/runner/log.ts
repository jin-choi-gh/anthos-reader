import type { Practice } from "../practice/types"
import type { Event } from "./types"

export function logKey(practice: Practice): string {
  return `anthos.log.${practice.id}.${practice.text}`
}

export function readLog(practice: Practice): Event[] {
  try {
    const saved = localStorage.getItem(logKey(practice))
    if (saved === null) return []
    const parsed: unknown = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed.filter(isEvent) : []
  } catch {
    return []
  }
}

export function writeLog(practice: Practice, log: Event[]): boolean {
  try {
    localStorage.setItem(logKey(practice), JSON.stringify(log))
    return true
  } catch {
    return false
  }
}

export function clearLog(practice: Practice) {
  try {
    localStorage.removeItem(logKey(practice))
  } catch {
    // storage is off: there is nothing saved to forget
  }
}

function isEvent(value: unknown): value is Event {
  if (typeof value !== "object" || value === null) return false
  const event = value as Record<string, unknown>
  if (!Number.isInteger(event.stage) || typeof event.at !== "number") return false
  if (event.kind === "visited") return Number.isInteger(event.step)
  if (event.kind === "finished")
    return typeof event.day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(event.day)
  if (event.kind === "responded")
    return Number.isInteger(event.step) && typeof event.text === "string"
  return false
}
