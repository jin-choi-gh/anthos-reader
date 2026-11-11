import { Lemma } from "./Lemma"
import { endsSelection } from "./selection"
import type { Note } from "./types"

/** The notes, one block each, in order: the lemma, then the paragraphs. Clicking a block selects its
 * note, and clicking the selected note again deselects it. A click that ends a text selection inside
 * the block is not a choice, so it changes nothing. */
export function NotesBlock({
  notes,
  selectedNote,
  onToggle,
}: {
  notes: Note[]
  selectedNote: number | null
  onToggle: (index: number) => void
}) {
  if (notes.length === 0) {
    return <p className="margin-empty">No notes on this text.</p>
  }
  return (
    <div className="notes">
      {notes.map((note) => {
        const selected = note.index === selectedNote
        return (
          <article
            key={note.index}
            className="note"
            data-selected={selected}
            onClick={(event) => {
              if (!endsSelection(event)) onToggle(note.index)
            }}
          >
            <button type="button" className="note-lemma" aria-pressed={selected}>
              <Lemma lemma={note.lemma} />
            </button>
            {note.paragraphs.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </article>
        )
      })}
    </div>
  )
}
