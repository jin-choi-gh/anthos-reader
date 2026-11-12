import type { Day, Position, Practice } from "../../practice/types"

const HOUR = 60 * 60 * 1000
export const DAY = 24 * HOUR

/** Where the run is, in a few words, for the dev panel's one line: "stage 1 of 2, step 2 of 2",
 * "stage 1 of 2, the rest", "the final stage". */
export function shortWhere(practice: Practice, position: Position): string {
  const stages = practice.stages.length
  if (position.stage === stages) return "the final stage"
  const steps = practice.stages[position.stage].steps.length
  const stage = `stage ${position.stage + 1} of ${stages}`
  if (position.step === steps) return `${stage}, the rest`
  return `${stage}, step ${position.step + 1} of ${steps}`
}

/** Where the run is, in full: the stage's name, and when the next stage opens while waiting. */
export function fullWhere(practice: Practice, position: Position): string {
  const stages = practice.stages.length
  if (position.stage === stages) return "the final stage"
  const { name, steps } = practice.stages[position.stage]
  const stage = `stage ${position.stage + 1} of ${stages}, "${name}"`
  if (position.step < steps.length) return `${stage}: step ${position.step + 1} of ${steps.length}`
  if (position.opensOn === null) return `${stage}: the rest`
  return `${stage}: the rest, the next stage opens ${position.opensOn}`
}

/** Today, and how far the dev clock is ahead of the real time: "2026-11-14 (clock +2 days)". Whole
 * days as days; anything else as hours, since only a day at a time is the panel's own step. */
export function clockText(today: Day, offset: number): string {
  if (offset <= 0) return today
  const ahead =
    offset % DAY === 0 ? plural(offset / DAY, "day") : plural(Math.round(offset / HOUR), "hour")
  return `${today} (clock +${ahead})`
}

/** How many events the log holds: "no events", "1 event", "5 events". */
export function eventsText(count: number): string {
  return count === 0 ? "no events" : plural(count, "event")
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`
}
