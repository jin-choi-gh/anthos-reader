import type { Practice } from "../practice/types"
import { gateOf } from "./gate"
import type { Day, Event, Position, Ruling } from "./types"

export function step(practice: Practice, log: Event[], today: Day): Position {
  let from = 0
  let opened: Day | null = null

  for (let stage = 0; stage < practice.stages.length; stage++) {
    const rest = practice.stages[stage].steps.length
    let step = 0
    let finished: { day: Day; index: number } | null = null

    for (let index = from; index < log.length; index++) {
      const event = log[index]
      if (event.stage !== stage) continue
      if (event.kind === "visited") {
        if (Number.isInteger(event.step) && event.step >= 0 && event.step <= rest) step = event.step
      } else if (
        event.kind === "finished" &&
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

export function ruling(practice: Practice, position: Position, target: number): Ruling {
  if (position.stage === practice.stages.length) {
    return { allowed: false, reason: { kind: "finished" } }
  }
  const rest = practice.stages[position.stage].steps.length
  if (!Number.isInteger(target) || target < 0) {
    return { allowed: false, reason: { kind: "noSuchStep" } }
  }
  if (target > rest) {
    return { allowed: false, reason: { kind: "waiting", opensOn: position.opensOn } }
  }
  return { allowed: true, to: target }
}

export function eventsOfMove(
  practice: Practice,
  position: Position,
  target: number,
  at: number,
  today: Day,
): Event[] {
  if (position.stage === practice.stages.length || target === position.step) return []
  const decision = ruling(practice, position, target)
  if (!decision.allowed) {
    throw new RangeError(
      `step ${target} is refused in stage ${position.stage}: ${decision.reason.kind}`,
    )
  }
  const rest = practice.stages[position.stage].steps.length
  const events: Event[] = [{ kind: "visited", stage: position.stage, step: target, at }]
  if (target === rest && position.opensOn === null) {
    events.push({ kind: "finished", stage: position.stage, at, day: today })
  }
  return events
}

/** The response saved on the step the reader is at: the latest one, or null if there is none. */
export function responseOf(log: Event[], position: Position): string | null {
  for (let index = log.length - 1; index >= 0; index--) {
    const event = log[index]
    if (
      event.kind === "responded" &&
      event.stage === position.stage &&
      event.step === position.step
    )
      return event.text
  }
  return null
}

/** The event that saves a response on the step the reader is at. Only a respond step takes one. */
export function eventOfResponse(
  practice: Practice,
  position: Position,
  text: string,
  at: number,
): Event {
  const gate = gateOf(practice, position)
  if (gate.kind !== "step" || gate.step.direction !== "respond") {
    throw new RangeError(`step ${position.step} of stage ${position.stage} takes no response`)
  }
  return { kind: "responded", stage: position.stage, step: position.step, text, at }
}
