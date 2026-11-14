import { useEffect, useMemo, useRef, useState } from "react"
import { now } from "../clock/clock"
import type { Anchor, TextId } from "../material/types"
import { whenForgotten } from "../storage/log"
import { notebookKey, readNotebook, writeNotebook } from "./log"
import { eventOfNoting, eventOfRevising, eventOfWithdrawing, notesOf } from "./notebook"
import type { NoteId, NotebookEvent, Provenance, ReaderNote } from "./types"

/** A text's notebook, open for as long as the component that holds it: the notes as they stand, and
 * three ways to write in it. Each writing is one event, kept at once. */
export interface Notebook {
  notes: readonly ReaderNote[]
  note(anchor: Anchor, body: string, from: Provenance | null): void
  revise(id: NoteId, body: string): void
  withdraw(id: NoteId): void
}

export function useNotebook(text: TextId): Notebook {
  const [events, setEvents] = useState(() => readNotebook(text))
  // The latest events, so that two writings in one moment both land, the second after the first
  const latest = useRef(events)
  const notes = useMemo(() => notesOf(events), [events])

  // Forgotten in development (clearNotebook): this copy is emptied too
  useEffect(
    () =>
      whenForgotten(notebookKey(text), () => {
        latest.current = []
        setEvents([])
      }),
    [text],
  )

  return useMemo(() => {
    const append = (event: NotebookEvent) => {
      const next = [...latest.current, event]
      latest.current = next
      writeNotebook(text, next)
      setEvents(next)
    }
    return {
      notes,
      note: (anchor, body, from) => append(eventOfNoting({ anchor, body, from }, stampNow())),
      revise: (id, body) => append(eventOfRevising(notesOf(latest.current), id, body, now())),
      withdraw: (id) => append(eventOfWithdrawing(notesOf(latest.current), id, now())),
    }
  }, [text, notes])
}

/** A new note's id and time: the only place either is made. */
function stampNow(): { id: NoteId; at: number } {
  return { id: crypto.randomUUID() as NoteId, at: now() }
}
