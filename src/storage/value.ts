/** The one value kept under a key that passes the guard; null when there is none, it cannot be
 * read, it does not pass, or storage is off. Unlike a log, it is overwritten, never added to. */
export function readValue<T>(key: string, isValue: (value: unknown) => value is T): T | null {
  try {
    const saved = localStorage.getItem(key)
    if (saved === null) return null
    const parsed: unknown = JSON.parse(saved)
    return isValue(parsed) ? parsed : null
  } catch {
    return null
  }
}

/** Keeps a value under a key, in place of whatever was there. False when storage is off or full:
 * then what was there stays. */
export function writeValue(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

/** Forgets the value under a key; nothing, when storage is off. */
export function clearValue(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // storage is off: there is nothing kept to forget
  }
}
