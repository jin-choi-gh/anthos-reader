// The shelf: append-only logs of events, one per key, kept in the browser's storage. A log is read
// back through its guard, so a damaged log, or one with events this reader no longer knows, loses
// only what cannot be read. When storage is off, nothing is kept and nothing fails.

/** The events kept under a key that pass the guard, in order; none when there are none, or the
 * stored value is not a list, or storage is off. */
export function readEvents<E>(key: string, isEvent: (value: unknown) => value is E): E[] {
  try {
    const saved = localStorage.getItem(key)
    if (saved === null) return []
    const parsed: unknown = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed.filter(isEvent) : []
  } catch {
    return []
  }
}

/** Keeps a log under a key, replacing what was there. False when storage is off or full. */
export function writeEvents<E>(key: string, events: readonly E[]): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(events))
    return true
  } catch {
    return false
  }
}

/** Forgets the log under a key. */
export function clearEvents(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // storage is off: there is nothing saved to forget
  }
}

/** Whether a value is a plain object, whose fields a guard may then look at. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
