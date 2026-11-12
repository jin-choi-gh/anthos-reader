import { nextDay, type Day } from "../clock/clock"
import { notesFrom } from "../notebook/notebook"
import type { ReaderNote } from "../notebook/types"
import { partsOf } from "../practice/lexicon"
import type { Practice } from "../practice/types"
import { restOf } from "./gate"
import type { Event, Ruling, Standing } from "./types"

/** Where the screening stands, from the projectionist's log, the spectator's notebook and the day:
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

  for (const [stage, { steps }] of practice.stages.entries()) {
    const rest = steps.length
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

    const position = { stage, step }
    if (finished === null) {
      return { position, opensOn: null, heldAt: heldAt(practice, stage, notes) }
    }
    if (stage === practice.stages.length - 1) break
    const opensOn = nextDay(finished.day)
    // A finished stage never holds the reader again: what is past is past
    if (today < opensOn) return { position, opensOn, heldAt: null }
    from = finished.index + 1
    opened = opensOn
  }

  return { position: { stage: practice.stages.length, step: 0 }, opensOn: null, heldAt: null }
}

/** The first step of a stage that asks for writing and has none in the notebook, or null. */
function heldAt(practice: Practice, stage: number, notes: readonly ReaderNote[]): number | null {
  const steps = practice.stages[stage]?.steps ?? []
  const index = steps.findIndex(
    (step, i) =>
      partsOf(step).writing !== null &&
      notesFrom(notes, { practice: practice.id, stage, step: i }).length === 0,
  )
  return index === -1 ? null : index
}

/** The claw: whether the projector will pull the reader to a step of the stage they are in, or
 * refuses, and why. It knows nothing of how the screen moves: a step back, a step on, or a jump. */
export function ruling(practice: Practice, standing: Standing, target: number): Ruling {
  const { position, opensOn, heldAt } = standing
  if (position.stage === practice.stages.length) {
    return { allowed: false, reason: { kind: "finished" } }
  }
  const rest = restOf(practice, position.stage)
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

/** What the projectionist logs when the reader moves to a step: the visit, and the stage finished
 * the first time its rest is reached. A move the claw refuses is a mistake on the screen: it throws. */
export function eventsOfMove(
  practice: Practice,
  standing: Standing,
  target: number,
  at: number,
  today: Day,
): Event[] {
  const { position, opensOn } = standing
  if (position.stage === practice.stages.length || target === position.step) return []
  const decision = ruling(practice, standing, target)
  if (!decision.allowed) {
    throw new RangeError(
      `step ${target} is refused in stage ${position.stage}: ${decision.reason.kind}`,
    )
  }
  const rest = restOf(practice, position.stage)
  const events: Event[] = [{ kind: "visited", stage: position.stage, step: target, at }]
  if (target === rest && opensOn === null) {
    events.push({ kind: "finished", stage: position.stage, at, day: today })
  }
  return events
}
