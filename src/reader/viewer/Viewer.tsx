import { useCallback, useLayoutEffect, useMemo, useRef } from "react"
import { Message } from "../../components/Folio"
import { Close } from "../../components/icons"
import { Lemma } from "../../components/Lemma"
import type { Materials } from "../../material/materials"
import { rangesOnLines } from "./choosing"
import type { LineRange } from "./cut"
import { NotesBlock } from "./NotesBlock"
import { PoemBlock } from "./PoemBlock"
import type { ViewerProjection, ViewerProtocol } from "../scenes/types"
import { TitleBlock } from "./TitleBlock"
import { useChoosing } from "./useChoosing"
import "./viewer.css"
import type { Note, Span } from "../../material/types"

/** What both parts of the viewer draw from: the scene's projection, with the notes it shows; the
 * texts it may name, for their poems; and the way back to the scene. */
interface ViewerProps {
  projection: ViewerProjection
  materials: Materials
  send: (message: ViewerProtocol["toScene"]) => void
}

/** The viewer's page: the projection's text, its title and its poem. Marked, its highlights can be
 * tapped; listed, the open note's words are marked, and the poem is only read. Either way the
 * chosen targets are drawn, and while choosing is on the reader chooses passages of the poem here,
 * each sent to the scene once chosen. */
export function ViewerPage({ projection, materials, send }: ViewerProps) {
  const material = materials(projection.text)
  const substrate = material?.substrate ?? null
  const area = useRef<HTMLDivElement>(null)
  const choose = useCallback((span: Span) => send({ kind: "choose", span }), [send])
  const choice = useChoosing(area, substrate, projection.choosing, choose)
  const chosenOn = useMemo(
    () => (substrate === null ? none : rangesOnLines(substrate, projection.chosen)),
    [substrate, projection.chosen],
  )
  const choiceOn = useMemo(
    () => (substrate === null || choice === null ? none : rangesOnLines(substrate, [choice])),
    [substrate, choice],
  )
  if (material === null) return <Message>Loading…</Message>
  const { poem } = material
  const { rangesOn } = projection.notes
  const choosing = { chosenOn, choiceOn }

  return (
    <>
      <TitleBlock poem={poem} />
      <div ref={area} className="choosing-area" data-choosing={projection.choosing}>
        {projection.kind === "marked" ? (
          <PoemBlock
            poem={poem}
            rangesOn={rangesOn}
            marked={projection.marked}
            open={projection.open}
            onTapNote={(note) => send({ kind: "tapNote", note })}
            {...choosing}
          />
        ) : (
          <PoemBlock
            poem={poem}
            rangesOn={rangesOn}
            marked={projection.open === null ? [] : [projection.open]}
            open={projection.open}
            {...choosing}
          />
        )}
      </div>
    </>
  )
}

/** No ranges on any line. */
function none(): LineRange[] {
  return []
}

/** The viewer's notes, for the margin or the sheet, from the projection's set. Marked: the note the
 * reader opened, if any, with an X. Listed: the shown notes, each one tapped to open or close it,
 * recalled notes with the prompts they answered, and, when they can be deleted, Delete on the open
 * one. */
export function ViewerNotes({ projection, send }: ViewerProps) {
  const { notes } = projection.notes

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
          recalled={projection.recalled}
          empty={projection.recalled === null ? "No notes here yet." : "Nothing to recall"}
          {...(projection.deletable
            ? { onDelete: (id: string) => send({ kind: "deleteNote", id }) }
            : {})}
        />
      )
  }
}

/** The note the reader opened from the poem: its lemma as its heading, an X to close it, and its
 * paragraphs. It is not a choice in a list, so the box itself does nothing. Opened, it takes the
 * focus; Escape closes it, as the X does; closed, it gives the focus back to the highlight that
 * opened it, so a reader on the keyboard keeps their place in the poem. */
function OpenNote({ note, onClose }: { note: Note; onClose: () => void }) {
  const box = useRef<HTMLElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)

  useLayoutEffect(() => {
    const opener = document.activeElement // the highlight, when it was tapped or pressed
    heading.current?.focus({ preventScroll: true })
    const article = box.current
    return () => {
      // Only if the focus is still in the note, or lost with it: a reader who has moved on, to
      // the highlight or to Next, is left where they are
      const focus = document.activeElement
      const inNote = focus === null || focus === document.body || !!article?.contains(focus)
      if (inNote && opener instanceof HTMLElement && opener.isConnected) {
        opener.focus({ preventScroll: true })
      }
    }
  }, [])

  return (
    <article
      ref={box}
      className="note open-note"
      data-selected="true"
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose()
      }}
    >
      <header className="open-note-head">
        <h2 className="note-lemma" ref={heading} tabIndex={-1}>
          <Lemma lemma={note.lemma} />
          <span className="note-close-mark" aria-hidden="true">
            {" ]"}
          </span>
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
