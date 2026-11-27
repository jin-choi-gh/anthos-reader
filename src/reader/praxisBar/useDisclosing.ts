import { useEffect, useRef, useState } from "react"
import type { DisclosureProjection, PraxisBarProtocol } from "../scenes/types"
import { GUARD_MS, lengthOf, typedAfter } from "./typing"

/** The note typing itself out: its place among the notes disclosed, and how many of its graphemes
 * are typed. */
export interface Typing {
  note: number
  typed: number
}

/** What the praxis bar does with notes disclosed, besides drawing them: the note typing, if any,
 * and the reader's moves. A note typing is finished by any move first, and the move is not made;
 * for a moment after a note is shown whole (GUARD_MS), a move on is not made either, so that a
 * second press meant to finish a note never discloses the next, or leaves the step, unread. */
export interface Disclosing {
  typing: Typing | null
  /** Disclose: the next note. */
  disclose(): void
  /** Forward: the next note disclosed, or, at the newest, the next note to disclose. */
  forward(): void
  /** Back: the note disclosed before the one open. */
  back(): void
  /** A note disclosed, by its place among them, opened. */
  turn(place: number): void
  /** Whether a move on is not made now: a note typing, or one just shown whole. */
  holding(): boolean
}

/** What is known of the notes disclosed when last drawn: under which key, and how many. */
interface Seen {
  key: string | null
  count: number
}

/** The notes disclosed, as the praxis bar plays them. A note the reader discloses types itself out,
 * after the viewer has swept in its words, unless the reader prefers reduced motion; notes disclosed
 * when the praxis bar first draws a step, as on a revisit, or several at once, as from another tab,
 * are shown whole. A new key is another step: what was typing there is let go. */
export function useDisclosing(
  disclosure: DisclosureProjection | null,
  send: (message: PraxisBarProtocol["toScene"]) => void,
): Disclosing {
  const [typing, setTyping] = useState<{ note: number; length: number } | null>(null)
  const [typed, setTyped] = useState(0)
  const [seen, setSeen] = useState<Seen>({ key: null, count: 0 })
  // When the last note was shown whole, for the guard
  const shownAt = useRef(-Infinity)

  // A note disclosed by the reader, one more than before under the same key, starts typing; any
  // other change of the notes disclosed lets a note typing go
  const key = disclosure?.key ?? null
  const count = disclosure?.notes.length ?? 0
  if (key !== seen.key || count !== seen.count) {
    const newest = disclosure?.notes[count - 1]
    const one = key !== null && key === seen.key && count === seen.count + 1
    setSeen({ key, count })
    setTyped(0)
    setTyping(
      one && newest !== undefined && !prefersReducedMotion()
        ? { note: count - 1, length: lengthOf(newest.paragraphs) }
        : null,
    )
  }

  // While a note types, a grapheme more as the time comes for it; at its end, it is shown whole
  useEffect(() => {
    if (typing === null) return
    const started = performance.now()
    let frame = 0
    const tick = () => {
      const now = typedAfter(performance.now() - started, typing.length)
      setTyped(now)
      if (now >= typing.length) {
        shownAt.current = performance.now()
        setTyping(null)
        return
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [typing])

  /** Finishes the note typing, if one is: true when it did, and the move is not made. */
  const finished = () => {
    if (typing === null) return false
    shownAt.current = performance.now()
    setTyping(null)
    return true
  }
  const quiet = () => performance.now() - shownAt.current < GUARD_MS
  /** Discloses the next note; with reduced motion it is shown whole at once, and guarded so. */
  const discloseNext = () => {
    send({ kind: "disclose" })
    if (prefersReducedMotion()) shownAt.current = performance.now()
  }
  const turnTo = (place: number) => {
    const note = disclosure?.notes[place]
    if (note !== undefined) send({ kind: "turn", note: note.index })
  }

  return {
    typing: typing === null ? null : { note: typing.note, typed },
    disclose() {
      if (finished() || quiet()) return
      if (disclosure?.more) discloseNext()
    },
    forward() {
      if (finished() || quiet() || disclosure === null) return
      const { current, notes, more } = disclosure
      if (current !== null && current < notes.length - 1) turnTo(current + 1)
      else if (more) discloseNext()
    },
    back() {
      if (finished()) return
      const current = disclosure?.current ?? null
      if (current !== null && current > 0) turnTo(current - 1)
    },
    turn(place) {
      if (finished()) return
      turnTo(place)
    },
    holding: () => typing !== null || quiet(),
  }
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}
