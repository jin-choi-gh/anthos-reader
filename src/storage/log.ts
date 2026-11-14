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

/** Adds events to the end of the log under a key. What is there stays as it is, even entries this
 * reader cannot read, so a log is only ever added to. A stored value that is not a list is damaged:
 * the events start a new log. False when storage is off or full: nothing is added. */
export function appendEvents(key: string, events: readonly unknown[]): boolean {
  try {
    const kept = storedList(localStorage.getItem(key))
    localStorage.setItem(key, JSON.stringify([...kept, ...events]))
    return true
  } catch {
    return false
  }
}

function storedList(saved: string | null): unknown[] {
  if (saved === null) return []
  try {
    const parsed: unknown = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
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

/** Calls `onChange` whenever the log under `key` changes other than by this page adding to it:
 * forgotten here (clearEvents), or added to or forgotten in another tab or window. Gives back the way
 * to stop. */
export function whenChanged(key: string, onChange: () => void): () => void {
  const forgotten = (event: Event) => {
    if (event instanceof CustomEvent && event.detail === key) onChange()
  }
  // The browser's "storage" event, in every other tab: its key, or null when all storage was cleared
  const elsewhere = (event: Event) => {
    const changed = "key" in event ? event.key : undefined
    if (changed === key || changed === null) onChange()
  }
  window.addEventListener(FORGOTTEN, forgotten)
  window.addEventListener("storage", elsewhere)
  return () => {
    window.removeEventListener(FORGOTTEN, forgotten)
    window.removeEventListener("storage", elsewhere)
  }
}

/** Whether a value is a plain object, whose fields a guard may then look at. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
