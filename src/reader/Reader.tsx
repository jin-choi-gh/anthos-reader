import { useEffect, useRef, useState } from "react"
import { loadTextualComplex } from "../loom/load"
import { toNotes } from "../loom/toNotes"
import { toPoem } from "../loom/toPoem"
import { libraryHref } from "../route"
import { ChevronLeft } from "../ui/icons"
import type { NoteIndex, Poem } from "./types"
import { usePlatform } from "./usePlatform"
import { TitleBlock } from "./TitleBlock"
import { PoemBlock } from "./PoemBlock"
import { NotesBlock } from "./NotesBlock"
import { Margin } from "./Margin"
import { BottomSheet } from "./BottomSheet"
import "./reader.css"

/** What the reader shows of one loaded textual complex: its poem and its notes, made from it
 * together. */
interface View {
  poem: Poem
  noteIndex: NoteIndex
}

export function Reader({ file }: { file: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const { layout, input } = usePlatform(ref)
  const [view, setView] = useState<View | null>(null)
  const [selectedNote, setSelectedNote] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    loadTextualComplex(file)
      .then((textualComplex) => {
        if (cancelled) return
        setView({ poem: toPoem(textualComplex), noteIndex: toNotes(textualComplex) })
        setSelectedNote(null) // ids belong to one file: notes:7 in another file is another note
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      })
    return () => {
      cancelled = true
    }
  }, [file])

  // The tab names the poem while it is open, and goes back to what it said when the reader closes
  useEffect(() => {
    if (view === null) return
    const previous = document.title
    document.title = `${view.poem.title} · Anthos`
    return () => {
      document.title = previous
    }
  }, [view])

  // Clicking a note selects it; clicking the selected note again deselects it
  const toggleNote = (id: string) => setSelectedNote((current) => (current === id ? null : id))

  // One list of notes, placed in whichever container the layout shows
  const notesBlock = view && (
    <NotesBlock notes={view.noteIndex.notes} selectedNote={selectedNote} onToggle={toggleNote} />
  )

  return (
    <div ref={ref} className="reader" data-layout={layout} data-input={input}>
      <article className="reader-text">
        <a className="reader-back" href={libraryHref}>
          <ChevronLeft size={18} />
          Library
        </a>
        <div className="text-block">
          {error !== null ? (
            <p className="reader-message">{error}</p>
          ) : view === null ? (
            <p className="reader-message">Loading…</p>
          ) : (
            <>
              <TitleBlock poem={view.poem} />
              <PoemBlock
                poem={view.poem}
                rangesOn={view.noteIndex.rangesOn}
                selectedNote={selectedNote}
              />
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
