import { Lemma } from "../../ui/Lemma"
import { endsSelection } from "./selection"
import type { Note } from "../../material/types"

/** The notes, one block each, in order: the lemma, then the paragraphs. Clicking a block selects its
 * note, and clicking the selected note again deselects it. A click that ends a text selection inside
 * the block is not a choice, so it changes nothing. Given onDelete, the selected note, if it has an
 * id, ends with Delete, which names it by its id; pressing Delete does not also toggle the note.
 * Blocks are keyed by id where notes have one, so that a block is never handed to another note. */
export function NotesBlock({
  notes,
  selectedNote,
  onToggle,
  onDelete,
}: {
  notes: Note[]
  selectedNote: number | null
  onToggle: (index: number) => void
  onDelete?: (id: string) => void
}) {
  if (notes.length === 0) {
    return <p className="margin-empty">No notes here yet.</p>
  }
  return (
    <div className="notes">
      {notes.map((note) => {
        const selected = note.index === selectedNote
        const { id } = note
        return (
          <article
            key={id ?? `#${note.index}`}
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
            {selected && id !== null && onDelete !== undefined && (
              <div className="note-actions">
                <button
                  type="button"
                  className="note-delete"
                  aria-label="Delete note"
                  onClick={(event) => {
                    event.stopPropagation()
                    onDelete(id)
                  }}
                >
                  Delete
                </button>
              </div>
            )}
          </article>
        )
      })}
    </div>
  )
}
