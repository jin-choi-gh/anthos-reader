import { useEffect, useMemo, useRef, useState } from "react"
import { now } from "../clock/clock"
import type { Substrate, TextId } from "../material/types"
import { problemsOf, wordedProblem } from "../practice/problems"
import type { Practice, PracticeId } from "../practice/types"
import { appendEvents, readEvents, whenChanged } from "../storage/log"
import { eventOfSaving, eventOfWithdrawing, isMadeEvent, madePracticesOf } from "./store"
import type { MadeEvent } from "./store"

/** The practices saved in the browser for a text, open for as long as the component that holds
 * them: the practices as they stand, a way to save one, which gives back what kept it from being
 * saved (nothing when it was), and a way to take one back. */
export interface MadePractices {
  practices: readonly Practice[]
  save(practice: Practice, substrate: Substrate): string[]
  withdraw(id: PracticeId): void
}

export function useMadePractices(text: TextId): MadePractices {
  const [events, setEvents] = useState(() => readMade(text))
  // The latest events, so that two writings in one moment both land, the second after the first
  const latest = useRef(events)
  const practices = useMemo(() => madePracticesOf(text, events), [text, events])

  // Changed in another tab: read it again
  useEffect(
    () =>
      whenChanged(keyOf(text), () => {
        const next = readMade(text)
        latest.current = next
        setEvents(next)
      }),
    [text],
  )

  return useMemo(() => {
    /** Keeps an event; false when storage is off or full, and then only this copy holds it. */
    const append = (event: MadeEvent): boolean => {
      const kept = appendEvents(keyOf(text), [event])
      const next = kept ? readMade(text) : [...latest.current, event]
      latest.current = next
      setEvents(next)
      return kept
    }
    const standing = () => madePracticesOf(text, latest.current)
    return {
      practices,
      save: (practice, substrate) => {
        const problems = problemsOf(practice, substrate)
        if (problems.length > 0) return problems.map((problem) => wordedProblem(practice, problem))
        const event = eventOfSaving(standing(), practice, substrate, now())
        if (event === null || append(event)) return []
        return ["the browser did not keep it: its storage is off or full"]
      },
      withdraw: (id) => {
        const event = eventOfWithdrawing(standing(), id, now())
        if (event !== null) append(event)
      },
    }
  }, [text, practices])
}

/** The key a text's saved practices are kept under. */
function keyOf(text: TextId): string {
  return `anthos.v1.made.${text}`
}

function readMade(text: TextId): MadeEvent[] {
  return readEvents(keyOf(text), isMadeEvent)
}
