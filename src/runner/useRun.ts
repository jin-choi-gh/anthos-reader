import { useMemo, useRef, useState, useSyncExternalStore } from "react"
import { now, today, type Day } from "../clock/clock"
import type { ReaderNote } from "../notebook/types"
import type { Practice } from "../practice/types"
import { clearLog, readLog, writeLog } from "./log"
import { eventsOfMove, standingOf } from "./step"
import type { Event, Standing } from "./types"

/** A screening of a practice, for as long as the component that holds it: where it stands, today,
 * the projectionist's log, and the two things the booth can do with it. */
export interface Run {
  standing: Standing
  today: Day
  log: readonly Event[]
  moveTo(target: number): void
  restart(): void
}

/** The projector, running the practice. The spectator's notebook is read, never written: the law
 * looks in it for the writing a step asks for. */
export function useRun(practice: Practice, notes: readonly ReaderNote[]): Run {
  const [log, setLog] = useState<readonly Event[]>(() => readLog(practice))
  // The latest log, so that a move made in the same moment as another lands after it
  const latest = useRef<readonly Event[]>(log)
  const day = useToday()
  const standing = useMemo(() => standingOf(practice, log, notes, day), [practice, log, notes, day])

  const keep = (next: readonly Event[]) => {
    latest.current = next
    writeLog(practice, next)
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
      if (events.length > 0) keep([...latest.current, ...events])
    },
    restart() {
      clearLog(practice)
      latest.current = []
      setLog([])
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
