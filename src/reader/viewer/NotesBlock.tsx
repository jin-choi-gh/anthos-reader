import { Fragment } from "react"
import { Lemma } from "../../ui/Lemma"
import { endsSelection } from "./selection"
import type { Note } from "../../material/types"
import type { Recalled } from "../scenes/types"

/** The notes, one block each, in order: the lemma, then the paragraphs. A note recalled shows first
 * the prompt it answered, and its lemma only when it is not on the whole poem; its button, which the
 * lemma otherwise is, then holds the prompt, or "Your response" when the prompt says nothing, so that
 * every note can still be reached by Tab. Clicking a block selects its note, and clicking the
 * selected note again deselects it. A click that ends a text selection inside the block is not a
 * choice, so it changes nothing. Given onDelete, the selected note, if it has an id, ends with
 * Delete, which names it by its id; pressing Delete does not also toggle the note. Blocks are keyed
 * by id where notes have one, so that a block is never handed to another note. A recalled note that
 * begins a stage has the stage's name above it, unless the name is blank. With no notes, it says
 * so, in the words it is given. */
export function NotesBlock({
  notes,
  selectedNote,
  onToggle,
  onDelete,
  recalled,
  empty = "No notes here yet.",
}: {
  notes: Note[]
  selectedNote: number | null
  onToggle: (index: number) => void
  onDelete?: (id: string) => void
  recalled?: readonly Recalled[] | null // by each note's place in its set
  empty?: string
}) {
  if (notes.length === 0) {
    return <p className="margin-empty">{empty}</p>
  }
  return (
    <div className="notes">
      {notes.map((note) => {
        const selected = note.index === selectedNote
        const { id } = note
        const recall = recalled?.[note.index] ?? null
        const prompt = recall?.prompt.filter((paragraph) => paragraph.trim() !== "") ?? []
        const showLemma = recall === null || !recall.whole
        const heading = recall?.heading?.trim() ?? ""
        return (
          <Fragment key={id ?? `#${note.index}`}>
            {heading !== "" && <h3 className="notes-heading">{heading}</h3>}
            <article
              className="note"
              data-selected={selected}
              onClick={(event) => {
                if (!endsSelection(event)) onToggle(note.index)
              }}
            >
              {recall !== null && !showLemma ? (
                <button type="button" className="note-lemma note-prompt" aria-pressed={selected}>
                  {prompt.length > 0 ? prompt.join(" ") : "Your response"}
                </button>
              ) : (
                <>
                  {prompt.length > 0 && (
                    <div className="note-prompt">
                      {prompt.map((paragraph, i) => (
                        <p key={i}>{paragraph}</p>
                      ))}
                    </div>
                  )}
                  <button type="button" className="note-lemma" aria-pressed={selected}>
                    <Lemma lemma={note.lemma} />
                  </button>
                </>
              )}
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
          </Fragment>
        )
      })}
    </div>
  )
}
