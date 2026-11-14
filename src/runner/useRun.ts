import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import { now, today, type Day } from "../clock/clock"
import type { ReaderNote } from "../notebook/types"
import type { Practice } from "../practice/types"
import { whenChanged } from "../storage/log"
import { appendLog, logKey, readLog } from "./log"
import { eventsOfMove, standingOf } from "./step"
import type { Event, Standing } from "./types"

/** A run of a practice, for as long as the component that holds it: where it stands, today, the
 * log, and the one thing that can be done with it: a move. */
export interface Run {
  standing: Standing
  today: Day
  log: readonly Event[]
  moveTo(target: number): void
}

/** The run of a practice. `notes` are read, never written: a step that asks for writing holds the
 * reader until it has a note. */
export function useRun(practice: Practice, notes: readonly ReaderNote[]): Run {
  const [log, setLog] = useState<readonly Event[]>(() => readLog(practice))
  // The latest log, so that a move made in the same moment as another lands after it
  const latest = useRef<readonly Event[]>(log)
  const day = useToday()
  const standing = useMemo(() => standingOf(practice, log, notes, day), [practice, log, notes, day])

  // Changed elsewhere (in another tab, or forgotten in development): read it again
  useEffect(
    () =>
      whenChanged(logKey(practice), () => {
        const next = readLog(practice)
        latest.current = next
        setLog(next)
      }),
    [practice],
  )

  const keep = (events: readonly Event[]) => {
    // Kept: read back what is stored, another tab's moves with it. Not kept: this copy holds them
    const next = appendLog(practice, events) ? readLog(practice) : [...latest.current, ...events]
    latest.current = next
    setLog(next)
  }

  return {
    standing,
    today: day,
    log,
    moveTo(target) {
      // Where it stands this very moment, as the day may have turned since the last drawing
      const current = today()
      const here = standingOf(practice, latest.current, notes, current)
      const events = eventsOfMove(practice, here, target, now(), current)
      if (events.length > 0) keep(events)
    },
  }
}

function useToday(): Day {
  return useSyncExternalStore(subscribeToDay, today)
}

function subscribeToDay(onChange: () => void): () => void {
  window.addEventListener("anthos-clock", onChange)
  document.addEventListener("visibilitychange", onChange)
  const timer = window.setInterval(onChange, 60_000)
  return () => {
    window.removeEventListener("anthos-clock", onChange)
    document.removeEventListener("visibilitychange", onChange)
    window.clearInterval(timer)
  }
}
