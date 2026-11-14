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

/** The announcement that a log was forgotten. Its detail is the log's key. */
const FORGOTTEN = "anthos-forgotten"

/** Forgets the log under a key, and announces it, so that whatever has the log open starts afresh.
 * It announces even when storage is off: nothing was kept, but an open copy must still be emptied. */
export function clearEvents(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // storage is off: there is nothing saved to forget
  }
  window.dispatchEvent(new CustomEvent<string>(FORGOTTEN, { detail: key }))
}

/** Calls `onForget` whenever the log under `key` is forgotten. Gives back the way to stop. */
export function whenForgotten(key: string, onForget: () => void): () => void {
  const listener = (event: Event) => {
    if (event instanceof CustomEvent && event.detail === key) onForget()
  }
  window.addEventListener(FORGOTTEN, listener)
  return () => window.removeEventListener(FORGOTTEN, listener)
}

/** Whether a value is a plain object, whose fields a guard may then look at. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
