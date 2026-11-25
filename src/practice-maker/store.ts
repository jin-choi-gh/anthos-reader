import type { Substrate, TextId } from "../material/types"
import { samePractice } from "../practice/fingerprint"
import { isPractice } from "../practice/guard"
import { problemsOf, wordedProblem } from "../practice/problems"
import type { Practice, PracticeId } from "../practice/types"
import { isRecord } from "../storage/log"

/** What is kept of the practices saved for a text: a practice saved, whole, or one taken back, by
 * its id. Only ever added to. */
export type MadeEvent =
  | { readonly kind: "saved"; readonly at: number; readonly practice: Practice }
  | { readonly kind: "withdrawn"; readonly at: number; readonly id: PracticeId }

/** The practices saved for a text as they stand: for each id, the one last saved, unless taken back
 * since, in the order last saved, so that the last saved comes last. A practice saved for another
 * text is not this text's, and is left out. */
export function madePracticesOf(text: TextId, events: readonly MadeEvent[]): Practice[] {
  const standing = new Map<PracticeId, Practice>()
  for (const event of events) {
    if (event.kind === "saved") {
      if (event.practice.text !== text) continue
      // Taken out and put back, so that the order is the order last saved
      standing.delete(event.practice.id)
      standing.set(event.practice.id, event.practice)
    } else {
      standing.delete(event.id)
    }
  }
  return [...standing.values()]
}

/** The event that saves a practice for its text, at a time given from outside. Null when the
 * practice is saved just as it is, whole (samePractice), since saving it again would change
 * nothing. Throws for a practice with problems on its text's lines:
 * only a practice with none is saved. */
export function eventOfSaving(
  saved: readonly Practice[],
  practice: Practice,
  substrate: Substrate,
  at: number,
): MadeEvent | null {
  const problems = problemsOf(practice, substrate)
  if (problems.length > 0) {
    const words = problems.map((problem) => wordedProblem(practice, problem))
    throw new RangeError(`a practice with problems is not saved: ${words.join("; ")}`)
  }
  const standing = saved.find((other) => other.id === practice.id)
  if (standing !== undefined && samePractice(standing, practice)) return null
  return { kind: "saved", at, practice }
}

/** The event that takes back a saved practice, so that its text runs its practice file again, or
 * else the practice saved before it. Null when no practice with that id stands saved. */
export function eventOfWithdrawing(
  saved: readonly Practice[],
  id: PracticeId,
  at: number,
): MadeEvent | null {
  return saved.some((practice) => practice.id === id) ? { kind: "withdrawn", at, id } : null
}

/** Whether a value read from storage is a MadeEvent: a saved practice passes isPractice. */
export function isMadeEvent(value: unknown): value is MadeEvent {
  if (!isRecord(value) || typeof value.at !== "number") return false
  switch (value.kind) {
    case "saved":
      return isPractice(value.practice)
    case "withdrawn":
      return typeof value.id === "string"
    default:
      return false // a kind this reader does not know
  }
}
