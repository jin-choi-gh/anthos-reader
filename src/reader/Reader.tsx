import { useEffect, useRef, useState } from "react"
import { loadVersion } from "../loom/load"
import { toNotes } from "../loom/toNotes"
import { toPoem } from "../loom/toPoem"
import type { NoteIndex, Poem } from "./types"
import { useLayout } from "./useLayout"
import { TitleBlock } from "./TitleBlock"
import { PoemBlock } from "./PoemBlock"
import { NotesBlock } from "./NotesBlock"
import { Margin } from "./Margin"
import { BottomSheet } from "./BottomSheet"
import "./reader.css"

/** What the reader shows of one loaded version: its poem and its notes, made from it together. */
interface View {
  poem: Poem
  noteIndex: NoteIndex
}

export function Reader({ file }: { file: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const layout = useLayout(ref)
  const [view, setView] = useState<View | null>(null)
  const [selectedNote, setSelectedNote] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    loadVersion(file)
      .then((version) => {
        if (cancelled) return
        setView({ poem: toPoem(version), noteIndex: toNotes(version) })
        setSelectedNote(null) // ids belong to one file: notes:7 in another file is another note
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      })
    return () => {
      cancelled = true
    }
  }, [file])

  // Clicking a note selects it; clicking the selected note again deselects it
  const toggleNote = (id: string) => setSelectedNote((current) => (current === id ? null : id))

  // One list of notes, placed in whichever container the layout shows
  const notesBlock = view && (
    <NotesBlock notes={view.noteIndex.notes} selectedNote={selectedNote} onToggle={toggleNote} />
  )

  return (
    <div ref={ref} className="reader" data-layout={layout}>
      <article className="reader-text">
        <div className="text-block">
          {error !== null ? (
            <p className="reader-message">{error}</p>
          ) : view === null ? (
            <p className="reader-message">Loading…</p>
          ) : (
            <>
              <TitleBlock poem={view.poem} />
              <PoemBlock poem={view.poem} />
            </>
          )}
        </div>
      </article>
      {layout === "spread" ? (
        <Margin>{notesBlock}</Margin>
      ) : (
        <BottomSheet label="Notes">{notesBlock}</BottomSheet>
      )}
    </div>
  )
}
