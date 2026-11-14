import type { Practice } from "../../practice/types"
import { gateOf } from "../../runner/gate"
import type { Day } from "../../clock/clock"
import type { Station, Standing } from "../../runner/types"

const HOUR = 60 * 60 * 1000
export const DAY = 24 * HOUR

/** Where the run is, in a few words, for the dev panel's one line: "stage 1 of 2, step 2 of 2",
 * "stage 1 of 2, the rest", "the final stage". */
export function shortWhere(practice: Practice, station: Station): string {
  const gate = gateOf(practice, station)
  if (gate.kind === "final") return "the final stage"
  const stage = `stage ${station.stage + 1} of ${practice.stages.length}`
  if (gate.kind === "rest") return `${stage}, the rest`
  return `${stage}, step ${station.step + 1} of ${gate.stage.steps.length}`
}

/** Where the run is, in full: the stage's name, the step that holds the reader until they write,
 * and when the next stage opens while waiting. */
export function fullWhere(practice: Practice, standing: Standing): string {
  const { station, opensOn, heldAt } = standing
  const gate = gateOf(practice, station)
  if (gate.kind === "final") return "the final stage"
  const stage = `stage ${station.stage + 1} of ${practice.stages.length}, "${gate.stage.name}"`
  if (gate.kind === "step") {
    const where = `${stage}: step ${station.step + 1} of ${gate.stage.steps.length}`
    return heldAt === null ? where : `${where}, held at step ${heldAt + 1} until written`
  }
  if (opensOn === null) return `${stage}: the rest`
  return `${stage}: the rest, the next stage opens ${opensOn}`
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

/** How many notes the notebook holds: "no notes", "1 note", "3 notes". */
export function notesText(count: number): string {
  return count === 0 ? "no notes" : plural(count, "note")
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`
}
