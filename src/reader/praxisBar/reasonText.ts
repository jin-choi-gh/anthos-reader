import { assertNever } from "../../assertNever"
import { nextDay, type Day } from "../../clock/clock"
import type { Reason } from "../../runner/types"

/** A refusal in words, for the reader, or null when the disabled button says enough by itself. */
export function reasonText(reason: Reason, today: Day): string | null {
  switch (reason.kind) {
    case "noSuchStep":
      return null // as Back on a stage's first step
    case "waiting":
      if (reason.opensOn === null) return "The next stage isn't open yet."
      if (reason.opensOn === nextDay(today)) return "The next stage opens tomorrow."
      return `The next stage opens on ${dayAndMonth(reason.opensOn)}.`
    case "unanswered": // Next is not drawn: the writing box says what is asked
    case "finished":
      return null
    default:
      return assertNever(reason)
  }
}

/** A day as "14 November". The day is a date, not an instant, so it is read and written in UTC,
 * where it cannot slip into the day before or after. */
function dayAndMonth(day: Day): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${day}T00:00:00Z`))
}
