import { daysAfter, type Day } from "../clock/clock"
import { notesFrom } from "../notebook/notebook"
import type { ReaderNote } from "../notebook/types"
import { fingerprintOfPractice } from "../practice/fingerprint"
import type { Practice } from "../practice/types"
import { daysUntilNext, finalOf, gateOf, restOf, standsAt } from "./gate"
import type { Event, Ruling, Standing } from "./types"

/** Where the run stands, from the runner's log, the reader's notebook and the day:
 * the step last visited in the stage that is open, when the next stage opens once this one is
 * finished, as the event that finished it fixed it, and which step holds the reader until they have
 * written. Once the last stage is finished the reader is in the final stage, unless they have since
 * gone back to a step of the last stage, to look again: then they are there, held nowhere. */
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
    let visitedAt = -1
    let finished: { day: Day; opens: Day; index: number } | null = null

    for (const [index, event] of log.entries()) {
      if (index < from || event.stage !== stage) continue
      if (event.kind === "visited") {
        if (Number.isInteger(event.step) && event.step >= 0 && event.step <= rest) {
          step = event.step
          visitedAt = index
        }
      } else if (
        finished === null &&
        event.day <= today &&
        (opened === null || event.day >= opened)
      ) {
        finished = { day: event.day, opens: event.opens, index }
      }
    }

    const station = { stage, step }
    if (finished === null) {
      return { station, opensOn: null, heldAt: heldAt(practice, stage, notes) }
    }
    const opensOn = finished.opens
    if (stage === final - 1) {
      // Gone back after finishing it, and not yet on to its rest, where the final stage stands
      if (visitedAt > finished.index && step < rest) return { station, opensOn, heldAt: null }
      break
    }
    // A finished stage never holds the reader again: what is past is past
    if (today < opensOn) return { station, opensOn, heldAt: null }
    from = finished.index + 1
    opened = opensOn
  }

  return { station: { stage: final, step: 0 }, opensOn: null, heldAt: null }
}

/** The first step of a stage that asks for writing and has none in the notebook, written on this
 * version of the practice, or null. */
function heldAt(practice: Practice, stage: number, notes: readonly ReaderNote[]): number | null {
  const fingerprint = fingerprintOfPractice(practice)
  for (let step = 0; step < restOf(practice, stage); step++) {
    const gate = gateOf(practice, { stage, step })
    if (gate.kind !== "step" || gate.step.writing === null) continue
    if (notesFrom(notes, { practice: practice.id, fingerprint, stage, step }).length === 0) {
      return step
    }
  }
  return null
}

/** Whether the reader may move to a step of the stage they stand in (standsAt), and whether the
 * move finishes it, or why not. From the final stage, which stands at the last stage's rest, the
 * reader may go back into the last stage; past that rest the practice is over. A move finishes a
 * stage when it reaches the rest of a stage not yet finished. */
export function ruling(practice: Practice, standing: Standing, target: number): Ruling {
  const { station, opensOn, heldAt } = standing
  const final = finalOf(practice)
  const here = standsAt(practice, station)
  // A practice with no stages has nowhere to go back to
  if (here.stage === final) return { allowed: false, reason: { kind: "finished" } }
  const rest = restOf(practice, here.stage)
  if (!Number.isInteger(target) || target < 0) {
    return { allowed: false, reason: { kind: "noSuchStep" } }
  }
  if (heldAt !== null && target > heldAt) {
    return { allowed: false, reason: { kind: "unanswered" } }
  }
  if (target > rest) {
    if (here.stage === final - 1) return { allowed: false, reason: { kind: "finished" } }
    return { allowed: false, reason: { kind: "waiting", opensOn } }
  }
  const finishes = target === rest && opensOn === null && station.stage !== final
  return { allowed: true, to: target, finishes }
}

/** What the runner logs when the reader moves to a step: the visit, and the stage finished
 * the first time its rest is reached, with the day the next stage opens, by the days the practice
 * gives it today. A move from the final stage is logged in the last stage, where it goes. A move the
 * law refuses is a mistake in the caller: it throws. */
export function eventsOfMove(
  practice: Practice,
  standing: Standing,
  target: number,
  at: number,
  today: Day,
): Event[] {
  const here = standsAt(practice, standing.station)
  if (target === here.step) return []
  const decision = ruling(practice, standing, target)
  if (!decision.allowed) {
    throw new RangeError(
      `step ${target} is refused in stage ${here.stage}: ${decision.reason.kind}`,
    )
  }
  const events: Event[] = [{ kind: "visited", stage: here.stage, step: target, at }]
  if (decision.finishes) {
    const opens = daysAfter(today, daysUntilNext(practice, here.stage))
    events.push({ kind: "finished", stage: here.stage, at, day: today, opens })
  }
  return events
}
