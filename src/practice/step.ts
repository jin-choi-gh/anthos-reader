import type { Day, Event, Position, Practice } from "./types"

export function step(practice: Practice, log: Event[], today: Day): Position {
  let from = 0
  let opened: Day | null = null

  for (let stage = 0; stage < practice.stages.length; stage++) {
    const closing = practice.stages[stage].steps.length
    let step = 0
    let finished: { day: Day; index: number } | null = null

    for (let index = from; index < log.length; index++) {
      const event = log[index]
      if (event.stage !== stage) continue
      if (event.kind === "visited") {
        if (Number.isInteger(event.step) && event.step >= 0 && event.step <= closing)
          step = event.step
      } else if (
        finished === null &&
        event.day <= today &&
        (opened === null || event.day >= opened)
      ) {
        finished = { day: event.day, index }
      }
    }

    if (finished === null) return { stage, step, opensOn: null }
    if (stage === practice.stages.length - 1) break
    const opensOn = nextDay(finished.day)
    if (today < opensOn) return { stage, step, opensOn }
    from = finished.index + 1
    opened = opensOn
  }

  return { stage: practice.stages.length, step: 0, opensOn: null }
}

/** The day after a day: "2026-11-10" → "2026-11-11". Dates, not instants, so no time zone applies. */
export function nextDay(day: Day): Day {
  const [year, month, date] = day.split("-").map(Number)
  return new Date(Date.UTC(year, month - 1, date + 1)).toISOString().slice(0, 10)
}

export function eventsOfMove(
  practice: Practice,
  position: Position,
  target: number,
  at: number,
  today: Day,
): Event[] {
  if (position.stage === practice.stages.length || target === position.step) return []
  const closing = practice.stages[position.stage].steps.length
  if (!Number.isInteger(target) || target < 0 || target > closing) {
    throw new RangeError(`step ${target} is not in stage ${position.stage} (0–${closing})`)
  }
  const events: Event[] = [{ kind: "visited", stage: position.stage, step: target, at }]
  if (target === closing && position.opensOn === null) {
    events.push({ kind: "finished", stage: position.stage, at, day: today })
  }
  return events
}
