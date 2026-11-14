import { nextDay, type Day } from "../clock/clock"
import { notesFrom } from "../notebook/notebook"
import type { ReaderNote } from "../notebook/types"
import { partsOf } from "../practice/lexicon"
import type { Practice } from "../practice/types"
import { finalOf, gateOf, restOf } from "./gate"
import type { Event, Ruling, Standing } from "./types"

/** Where the run stands, from the runner's log, the reader's notebook and the day:
 * the step last visited in the stage that is open, when the next stage opens once this one is
 * finished, and which step holds the reader until they have written. */
export function standingOf(
  practice: Practice,
  log: readonly Event[],
  notes: readonly ReaderNote[],
  today: Day,
): Standing {
  let from = 0
  let opened: Day | null = null

  const final = finalOf(practice)
  for (let stage = 0; stage < final; stage++) {
    const rest = restOf(practice, stage)
    let step = 0
    let finished: { day: Day; index: number } | null = null

    for (const [index, event] of log.entries()) {
      if (index < from || event.stage !== stage) continue
      if (event.kind === "visited") {
        if (Number.isInteger(event.step) && event.step >= 0 && event.step <= rest) step = event.step
      } else if (
        finished === null &&
        event.day <= today &&
        (opened === null || event.day >= opened)
      ) {
        finished = { day: event.day, index }
      }
    }

    const station = { stage, step }
    if (finished === null) {
      return { station, opensOn: null, heldAt: heldAt(practice, stage, notes) }
    }
    if (stage === final - 1) break
    const opensOn = nextDay(finished.day)
    // A finished stage never holds the reader again: what is past is past
    if (today < opensOn) return { station, opensOn, heldAt: null }
    from = finished.index + 1
    opened = opensOn
  }

  return { station: { stage: final, step: 0 }, opensOn: null, heldAt: null }
}

/** The first step of a stage that asks for writing and has none in the notebook, or null. */
function heldAt(practice: Practice, stage: number, notes: readonly ReaderNote[]): number | null {
  for (let step = 0; step < restOf(practice, stage); step++) {
    const gate = gateOf(practice, { stage, step })
    if (gate.kind !== "step" || partsOf(gate.step).writing === null) continue
    if (notesFrom(notes, { practice: practice.id, stage, step }).length === 0) return step
  }
  return null
}

/** Whether the reader may move to a step of the stage they are in, or why not. */
export function ruling(practice: Practice, standing: Standing, target: number): Ruling {
  const { station, opensOn, heldAt } = standing
  if (station.stage === finalOf(practice)) {
    return { allowed: false, reason: { kind: "finished" } }
  }
  const rest = restOf(practice, station.stage)
  if (!Number.isInteger(target) || target < 0) {
    return { allowed: false, reason: { kind: "noSuchStep" } }
  }
  if (heldAt !== null && target > heldAt) {
    return { allowed: false, reason: { kind: "unanswered" } }
  }
  if (target > rest) {
    return { allowed: false, reason: { kind: "waiting", opensOn } }
  }
  return { allowed: true, to: target }
}

/** What the runner logs when the reader moves to a step: the visit, and the stage finished
 * the first time its rest is reached. A move the law refuses is a mistake in the caller: it throws. */
export function eventsOfMove(
  practice: Practice,
  standing: Standing,
  target: number,
  at: number,
  today: Day,
): Event[] {
  const { station, opensOn } = standing
  if (station.stage === finalOf(practice) || target === station.step) return []
  const decision = ruling(practice, standing, target)
  if (!decision.allowed) {
    throw new RangeError(
      `step ${target} is refused in stage ${station.stage}: ${decision.reason.kind}`,
    )
  }
  const rest = restOf(practice, station.stage)
  const events: Event[] = [{ kind: "visited", stage: station.stage, step: target, at }]
  if (target === rest && opensOn === null) {
    events.push({ kind: "finished", stage: station.stage, at, day: today })
  }
  return events
}
