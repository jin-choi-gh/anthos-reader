import type { Day } from "./types"

/** The hour a day starts, local time: something done at 02:00 on Wednesday
 * counts as Tuesday. */
export const DAY_STARTS_AT = 4

/** The day an instant falls on, in this device's time zone, with days starting at DAY_STARTS_AT. */
export function dayOf(at: number): Day {
  const date = new Date(at)
  date.setHours(date.getHours() - DAY_STARTS_AT)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Now, in ms: the real time, moved forward by the dev panel's offset in dev builds only. */
export function now(): number {
  return Date.now() + (import.meta.env.DEV ? readOffset() : 0)
}

/** Today, by the clock. */
export function today(): Day {
  return dayOf(now())
}

const OFFSET_KEY = "anthos.dev.clockOffset"

/** Dev only: moves the clock forward. It never goes back, except by resetClock. */
export function advance(ms: number) {
  if (!import.meta.env.DEV || ms <= 0) return
  writeOffset(readOffset() + ms)
}

/** Dev only: back to the real time. Use it with restarting a practice, or logged events may lie ahead of the clock. */
export function resetClock() {
  writeOffset(0)
}

function readOffset(): number {
  try {
    const offset = Number(localStorage.getItem(OFFSET_KEY))
    return Number.isFinite(offset) && offset > 0 ? offset : 0
  } catch {
    return 0
  }
}

function writeOffset(ms: number) {
  try {
    if (ms === 0) localStorage.removeItem(OFFSET_KEY)
    else localStorage.setItem(OFFSET_KEY, String(ms))
  } catch {
    // storage is off: the clock stays where it is
  }
  window.dispatchEvent(new Event("anthos-clock"))
}
