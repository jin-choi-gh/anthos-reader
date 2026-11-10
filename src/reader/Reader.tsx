import { useEffect, useRef, useState } from "react"
import { loadTextualComplex } from "../loom/load"
import { toNotes } from "../loom/toNotes"
import { toPoem } from "../loom/toPoem"
import { libraryHref } from "../route"
import { ChevronLeft } from "../ui/icons"
import { useLoaded } from "../useLoaded"
import type { Notes, Poem } from "./types"
import { usePlatform } from "./usePlatform"
import { TitleBlock } from "./TitleBlock"
import { PoemBlock } from "./PoemBlock"
import { NotesBlock } from "./NotesBlock"
import { Margin } from "./Margin"
import { BottomSheet } from "./BottomSheet"
import "./reader.css"

/** What the reader shows of one loaded textual complex: its poem and its notes, made from it
 * together. A reader shows one file for its whole life: App gives it a key of its file, so another
 * file is another reader, and a note selected in one never carries over to the next. */
interface View {
  poem: Poem
  notes: Notes
}

async function loadView(file: string): Promise<View> {
  const textualComplex = await loadTextualComplex(file)
  return { poem: toPoem(textualComplex), notes: toNotes(textualComplex) }
}

export function Reader({ file }: { file: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const { layout, input } = usePlatform(ref)
  const { value: view, error } = useLoaded(file, loadView)
  const [selectedNote, setSelectedNote] = useState<number | null>(null)

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
  const toggleNote = (index: number) =>
    setSelectedNote((current) => (current === index ? null : index))

  // One list of notes, placed in whichever container the layout shows
  const notesBlock = view && (
    <NotesBlock notes={view.notes.notes} selectedNote={selectedNote} onToggle={toggleNote} />
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
                rangesOn={view.notes.rangesOn}
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
