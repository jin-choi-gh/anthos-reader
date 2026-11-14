import { useEffect, useMemo, useRef, useState } from "react"
import { now } from "../clock/clock"
import type { TextId } from "../material/types"
import { whenChanged } from "../storage/log"
import { appendNotebook, notebookKey, readNotebook } from "./log"
import { eventOfNoting, eventOfRevising, eventOfWithdrawing, notesOf } from "./notebook"
import type { NewNote, NoteId, NotebookEvent, ReaderNote } from "./types"

/** A text's notebook, open for as long as the component that holds it: the notes as they stand, and
 * three ways to write in it. Each writing is one event, kept at once. */
export interface Notebook {
  notes: readonly ReaderNote[]
  note(note: NewNote): void
  revise(id: NoteId, body: string): void
  withdraw(id: NoteId): void
}

export function useNotebook(text: TextId): Notebook {
  const [events, setEvents] = useState(() => readNotebook(text))
  // The latest events, so that two writings in one moment both land, the second after the first
  const latest = useRef(events)
  const notes = useMemo(() => notesOf(events), [events])

  // Changed elsewhere (in another tab, or forgotten in development): read it again
  useEffect(
    () =>
      whenChanged(notebookKey(text), () => {
        const next = readNotebook(text)
        latest.current = next
        setEvents(next)
      }),
    [text],
  )

  return useMemo(() => {
    const append = (event: NotebookEvent) => {
      // Kept: read back what is stored, other tabs' notes with it. Not kept (storage is off): this
      // copy holds it for as long as the page is open
      const next = appendNotebook(text, [event]) ? readNotebook(text) : [...latest.current, event]
      latest.current = next
      setEvents(next)
    }
    return {
      notes,
      note: (note) => append(eventOfNoting(note, stampNow())),
      revise: (id, body) => append(eventOfRevising(notesOf(latest.current), id, body, now())),
      withdraw: (id) => append(eventOfWithdrawing(notesOf(latest.current), id, now())),
    }
  }, [text, notes])
}

/** A new note's id and time: the only place either is made. */
function stampNow(): { id: NoteId; at: number } {
  return { id: crypto.randomUUID() as NoteId, at: now() }
}
