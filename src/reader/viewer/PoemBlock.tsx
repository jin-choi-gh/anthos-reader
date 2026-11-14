import type { CSSProperties, KeyboardEvent, MouseEvent } from "react"
import { useEffect, useRef } from "react"
import { cut, type LineRange } from "./cut"
import { endsSelection } from "./selection"
import type { Line, NoteRange, Poem } from "../../material/types"

/** A range on a line, and what it is: a marked note's, a chosen target's, or the passage being
 * chosen. */
type Drawn = LineRange &
  ({ kind: "note"; noteIndex: number } | { kind: "chosen" } | { kind: "choice" })

/** The poem, stanza by stanza, every fifth line numbered. The marked notes' words are highlighted;
 * with none marked, each line is drawn as it is. The open note's words are brought into view when it
 * opens, and the marked notes' words when they change, if they are out of view. Given onTapNote, a
 * highlight is a control: tapped, or pressed with Enter or Space, it names its note. The chosen
 * targets and the passage being chosen are drawn over the text, by each line's ranges. Each line
 * says which line of the substrate it is, and each piece of it where it starts, so that a point on
 * the screen can be found in the poem. */
export function PoemBlock({
  poem,
  rangesOn,
  marked,
  open,
  onTapNote,
  chosenOn,
  choiceOn,
}: {
  poem: Poem
  rangesOn: (indexInSubstrate: number) => NoteRange[]
  marked: number[]
  open: number | null
  onTapNote?: (note: number) => void
  chosenOn: (indexInSubstrate: number) => LineRange[]
  choiceOn: (indexInSubstrate: number) => LineRange[]
}) {
  // What is drawn on a line: the marked notes' ranges, the chosen targets', the choice's
  const drawnOn = (line: Line): Drawn[] => [
    ...rangesOn(line.indexInSubstrate)
      .filter((range) => marked.includes(range.noteIndex))
      .map((range) => ({ ...range, kind: "note" as const })),
    ...chosenOn(line.indexInSubstrate).map((range) => ({ ...range, kind: "chosen" as const })),
    ...choiceOn(line.indexInSubstrate).map((range) => ({ ...range, kind: "choice" as const })),
  ]

  const poemRef = useRef<HTMLDivElement>(null)

  // The marked notes by their indexes, so a new array with the same notes is no change
  const markedKey = marked.join(" ")

  // When a note opens, bring its first words into view. Closing one moves nothing
  useEffect(() => {
    if (open !== null) bringIntoView(poemRef.current?.querySelector('mark[data-open="true"]'))
  }, [open])

  // When other notes are marked, as on a new step, bring the first of their words into view
  useEffect(() => {
    bringIntoView(poemRef.current?.querySelector("mark"))
  }, [markedKey])

  return (
    <div className="poem" ref={poemRef}>
      {poem.stanzas.map((stanza, i) => (
        <div className="stanza" key={i}>
          {stanza.lines.map((line) => (
            <div
              key={line.id}
              className="line"
              data-line-id={line.id}
              data-line={line.indexInSubstrate}
              style={{ "--indent": line.indent } as CSSProperties}
            >
              {line.number % 5 === 0 && (
                <span className="line-number" aria-hidden="true">
                  {line.number}
                </span>
              )}
              <span className="line-text">
                {cut(line.text, drawnOn(line)).map((piece, j) => {
                  const notes = piece.ranges.flatMap((range) =>
                    range.kind === "note" ? [range.noteIndex] : [],
                  )
                  const drawn = {
                    "data-start": piece.start,
                    "data-chosen": piece.ranges.some((range) => range.kind === "chosen"),
                    "data-choice": piece.ranges.some((range) => range.kind === "choice"),
                  }
                  const [note] = notes // where marked notes overlap, the first
                  if (note === undefined) {
                    return (
                      <span key={j} {...drawn}>
                        {piece.text}
                      </span>
                    )
                  }
                  const isOpen = notes.includes(open ?? -1)
                  return (
                    <mark
                      key={j}
                      data-open={isOpen}
                      {...drawn}
                      {...(onTapNote && tappable(note, isOpen, onTapNote))}
                    >
                      {piece.text}
                    </mark>
                  )
                })}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

/** Scrolls words to the top of the view if they are out of it, and leaves them be if they are in it.
 * No words, as for a whole-poem note, which marks nothing: nothing moves. */
function bringIntoView(words: Element | null | undefined) {
  if (!words) return
  const page = getComputedStyle(document.documentElement)
  const visibleTop = parseFloat(page.scrollPaddingTop) || 0
  const visibleBottom = window.innerHeight - (parseFloat(page.scrollPaddingBottom) || 0)
  const { top, bottom } = words.getBoundingClientRect()
  if (top >= visibleTop && bottom <= visibleBottom) return // already in view
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  words.scrollIntoView({ block: "start", behavior: reduceMotion ? "auto" : "smooth" })
}

/** What makes a highlight a control: a button to assistive technology, reachable by Tab, and
 * answering a click (unless it ends a text selection), Enter or Space. */
function tappable(note: number, isOpen: boolean, onTapNote: (note: number) => void) {
  return {
    role: "button",
    tabIndex: 0,
    "aria-expanded": isOpen,
    onClick: (event: MouseEvent<HTMLElement>) => {
      if (!endsSelection(event)) onTapNote(note)
    },
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      if (event.key !== "Enter" && event.key !== " ") return
      event.preventDefault() // Space would otherwise scroll the page
      onTapNote(note)
    },
  }
}
