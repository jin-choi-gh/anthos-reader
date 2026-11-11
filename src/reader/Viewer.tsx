import { Close } from "../ui/icons"
import { Lemma } from "./Lemma"
import type { Materials } from "./materials"
import { NotesBlock } from "./NotesBlock"
import { PoemBlock } from "./PoemBlock"
import type { ViewerProjection, ViewerProtocol } from "./scenes/types"
import { TitleBlock } from "./TitleBlock"
import type { Note } from "./types"

/** What both parts of the viewer draw from: the scene's projection, the texts it may name, and the
 * way back to the scene. */
interface ViewerProps {
  projection: ViewerProjection
  materials: Materials
  send: (message: ViewerProtocol["toScene"]) => void
}

/** The viewer's page: the projection's text, its title and its poem. Marked, its highlights can be
 * tapped; listed, the open note's words are marked, and the poem is only read. */
export function ViewerPage({ projection, materials, send }: ViewerProps) {
  const material = materials(projection.text)
  if (material === null) return <p className="reader-message">Loading…</p>
  const { poem, notes } = material

  switch (projection.kind) {
    case "marked":
      return (
        <>
          <TitleBlock poem={poem} />
          <PoemBlock
            poem={poem}
            rangesOn={notes.rangesOn}
            marked={projection.marked}
            open={projection.open}
            onTapNote={(note) => send({ kind: "tapNote", note })}
          />
        </>
      )
    case "listed":
      return (
        <>
          <TitleBlock poem={poem} />
          <PoemBlock
            poem={poem}
            rangesOn={notes.rangesOn}
            marked={projection.open === null ? [] : [projection.open]}
            open={projection.open}
          />
        </>
      )
  }
}

/** The viewer's notes, for the margin or the sheet. Marked: the note the reader opened, if any, with
 * an X. Listed: the shown notes, each one tapped to open or close it. Nothing while the text loads:
 * the page says so. */
export function ViewerNotes({ projection, materials, send }: ViewerProps) {
  const material = materials(projection.text)
  if (material === null) return null
  const { notes } = material.notes

  switch (projection.kind) {
    case "marked": {
      const open = notes.find((note) => note.index === projection.open)
      if (open === undefined) return null
      return <OpenNote note={open} onClose={() => send({ kind: "closeNote" })} />
    }
    case "listed":
      return (
        <NotesBlock
          notes={notes.filter((note) => projection.shown.includes(note.index))}
          selectedNote={projection.open}
          onToggle={(note) => send({ kind: "tapNote", note })}
        />
      )
  }
}

/** The note the reader opened from the poem: its lemma as its heading, an X to close it, and its
 * paragraphs. It is not a choice in a list, so the box itself does nothing. */
function OpenNote({ note, onClose }: { note: Note; onClose: () => void }) {
  return (
    <article className="note open-note" data-selected="true">
      <header className="open-note-head">
        <h2 className="note-lemma">
          <Lemma lemma={note.lemma} />
        </h2>
        <button type="button" className="open-note-close" aria-label="Close note" onClick={onClose}>
          <Close size={18} />
        </button>
      </header>
      {note.paragraphs.map((paragraph, i) => (
        <p key={i}>{paragraph}</p>
      ))}
    </article>
  )
}
