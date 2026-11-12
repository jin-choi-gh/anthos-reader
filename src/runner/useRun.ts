import { useMemo, useState, useSyncExternalStore } from "react"
import { now, today } from "./clock"
import { clearLog, readLog, writeLog } from "./log"
import { eventOfResponse, eventsOfMove, step } from "./step"
import type { Practice } from "../practice/types"
import type { Day, Event, Position } from "./types"

export interface Run {
  position: Position
  today: Day
  log: Event[]
  moveTo(target: number): void
  respond(text: string): void
  restart(): void
}

export function useRun(practice: Practice): Run {
  const [log, setLog] = useState(() => readLog(practice))
  const day = useToday()
  const position = useMemo(() => step(practice, log, day), [practice, log, day])

  return {
    position,
    today: day,
    log,
    moveTo(target) {
      const current = today()
      const events = eventsOfMove(practice, step(practice, log, current), target, now(), current)
      if (events.length === 0) return
      const next = [...log, ...events]
      writeLog(practice, next)
      setLog(next)
    },
    respond(text) {
      const event = eventOfResponse(practice, step(practice, log, today()), text, now())
      const next = [...log, event]
      writeLog(practice, next)
      setLog(next)
    },
    restart() {
      clearLog(practice)
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
