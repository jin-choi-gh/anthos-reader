import type { CSSProperties, KeyboardEvent, MouseEvent } from "react"
import { useEffect, useRef, useState } from "react"
import { codePoints } from "../../material/codePoints"
import { assertNever } from "../../assertNever"
import { cut, type LineRange } from "./cut"
import { unitByKey, type GapRange, type PickRange } from "./gaps"
import { endsSelection } from "./selection"
import type { Line, NoteRange, Poem } from "../../material/types"
import type { GapProjection, GapsProjection, PickingProjection } from "../scenes/types"

/** A range on a line, and what it is: a marked note's, a chosen target's, the passage being
 * chosen, or a gap's. */
type Drawn = LineRange &
  (
    | { kind: "note"; noteIndex: number }
    | { kind: "chosen" }
    | { kind: "choice" }
    | { kind: "gap"; gap: number }
    | { kind: "pick"; unit: number }
  )

/** The poem, stanza by stanza, every fifth line numbered. The marked notes' words are highlighted;
 * with none marked, each line is drawn as it is. The open note's words are brought into view when it
 * opens, and the marked notes' words when they change, if they are out of view. Given onTapNote, a
 * highlight is a control: tapped, or pressed with Enter or Space, it names its note. The chosen
 * targets and the passage being chosen are drawn over the text, by each line's ranges. A restore's
 * gaps are drawn in place of the text they take out, which is never drawn until a gap is restored:
 * empty, filled with a slip, which tapped goes back (onEmptyGap), or restored; the gap the next
 * slip fills is brought into view when it changes, if it is out of view. In Form Practice, the words
 * or lines to pick are buttons, one Tab stop for them all, moved between with the arrow keys
 * (onPick). Each line says which line
 * of the substrate it is, and each piece of it where it starts, so that a point on the screen can be
 * found in the poem. With `sweep`, as for notes disclosed, the open note's words are swept in as
 * they are drawn, each piece in turn. */
export function PoemBlock({
  poem,
  rangesOn,
  marked,
  open,
  onTapNote,
  chosenOn,
  choiceOn,
  gaps = null,
  gapsOn = noGaps,
  onEmptyGap,
  picking = null,
  picksOn = noPicks,
  onPick,
  sweep = false,
}: {
  poem: Poem
  rangesOn: (indexInSubstrate: number) => NoteRange[]
  marked: number[]
  open: number | null
  onTapNote?: (note: number) => void
  chosenOn: (indexInSubstrate: number) => LineRange[]
  choiceOn: (indexInSubstrate: number) => LineRange[]
  gaps?: GapsProjection | null
  gapsOn?: (indexInSubstrate: number) => GapRange[]
  onEmptyGap?: (gap: number) => void
  picking?: PickingProjection | null
  picksOn?: (indexInSubstrate: number) => PickRange[]
  onPick?: (unit: number) => void
  sweep?: boolean
}) {
  // What is drawn on a line: the marked notes' ranges, the chosen targets', the choice's, the gaps'
  const drawnOn = (line: Line): Drawn[] => [
    ...rangesOn(line.indexInSubstrate)
      .filter((range) => marked.includes(range.noteIndex))
      .map((range) => ({ ...range, kind: "note" as const })),
    ...chosenOn(line.indexInSubstrate).map((range) => ({ ...range, kind: "chosen" as const })),
    ...choiceOn(line.indexInSubstrate).map((range) => ({ ...range, kind: "choice" as const })),
    ...gapsOn(line.indexInSubstrate).map((range) => ({ ...range, kind: "gap" as const })),
    ...picksOn(line.indexInSubstrate).map((range) => ({ ...range, kind: "pick" as const })),
  ]

  // The one word or line to pick that Tab reaches; the arrow keys move it
  const [tabStop, setTabStop] = useState(0)
  const units = picking?.units ?? []
  const reached = Math.min(tabStop, Math.max(units.length - 1, 0))
  const focusUnit = (unit: number) => {
    if (unit < 0 || unit >= units.length) return
    setTabStop(unit)
    poemRef.current?.querySelector<HTMLElement>(`[data-unit="${unit}"]`)?.focus()
  }
  const onPickKey = (event: KeyboardEvent<HTMLElement>, unit: number) => {
    const next = unitByKey(units, unit, event.key)
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault() // Space would otherwise scroll the page
      onPick?.(unit)
    } else if (next !== null) {
      event.preventDefault()
      focusUnit(next)
    }
  }

  const poemRef = useRef<HTMLDivElement>(null)

  // The marked notes by their indexes, so a new array with the same notes is no change
  const markedKey = marked.join(" ")

  // When a note opens, bring its first words into view. Closing one moves nothing. Two frames on,
  // so that what opening it changed around the poem, as the dock's height, is known by then
  useEffect(() => {
    if (open === null) return
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() =>
        bringIntoView(poemRef.current?.querySelector('mark[data-open="true"]')),
      )
    })
    return () => cancelAnimationFrame(frame)
  }, [open])

  // When other notes are marked, as on a new step, bring the first of their words into view
  useEffect(() => {
    bringIntoView(poemRef.current?.querySelector("mark"))
  }, [markedKey])

  // When the gap the next slip fills changes, bring it into view
  const next = gaps?.next ?? null
  useEffect(() => {
    if (next !== null) bringIntoView(poemRef.current?.querySelector('.gap[data-next="true"]'))
  }, [next])

  // Each piece of the marked words, in the poem's order, for the sweep
  let swept = 0

  return (
    <div className="poem" ref={poemRef} data-sweep={sweep}>
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
                  // A word or line to pick is drawn once, where it starts, as a button
                  const pick = piece.ranges.find((range) => range.kind === "pick")
                  if (pick !== undefined) {
                    const unit = picking?.units[pick.unit]
                    if (piece.start !== pick.start || unit === undefined) return null
                    const words = codePoints(line.text).slice(pick.start, pick.end).join("")
                    return (
                      <span
                        key={j}
                        className="pick"
                        data-of={picking?.of}
                        data-taken={unit.taken}
                        data-unit={pick.unit}
                        data-start={piece.start}
                        role="button"
                        tabIndex={pick.unit === reached ? 0 : -1}
                        aria-pressed={unit.taken}
                        onFocus={() => setTabStop(pick.unit)}
                        onClick={(event) => {
                          if (!endsSelection(event)) onPick?.(pick.unit)
                        }}
                        onKeyDown={(event) => onPickKey(event, pick.unit)}
                      >
                        {words}
                      </span>
                    )
                  }
                  // A gap is drawn once, where it starts, and the text it takes out never
                  const gap = piece.ranges.find((range) => range.kind === "gap")
                  if (gap !== undefined) {
                    const drawn = gaps?.gaps[gap.gap]
                    if (piece.start !== gap.start || gaps === null || drawn === undefined) {
                      return null
                    }
                    return (
                      <GapMark
                        key={j}
                        gap={drawn}
                        index={gap.gap}
                        of={gaps}
                        start={piece.start}
                        onEmpty={onEmptyGap}
                      />
                    )
                  }
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
                      // By its note, so that another note's words are drawn afresh, and swept in
                      key={`${note}:${j}`}
                      data-open={isOpen}
                      style={{ "--sweep-order": swept++ } as CSSProperties}
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

/** No gaps on any line. */
function noGaps(): GapRange[] {
  return []
}

/** Nothing to pick on any line. */
function noPicks(): PickRange[] {
  return []
}

/** A gap, in place of the text it takes out: empty, as an edition marks a lacuna, [ ... ] for a
 * word and [ ... ... ... ] for a line, every gap of a kind the same, so that it gives nothing away;
 * filled with a slip, the reader's conjecture in brackets, a button that sends the slip back; or
 * restored, the poem's own words. Empty, it is read out as which gap it is, not as its dots. */
function GapMark({
  gap,
  index,
  of,
  start,
  onEmpty,
}: {
  gap: GapProjection
  index: number
  of: GapsProjection
  start: number
  onEmpty: ((gap: number) => void) | undefined
}) {
  const which = `gap ${index + 1} of ${of.gaps.length}`
  const shared = {
    className: "gap",
    "data-of": of.of,
    "data-state": gap.state,
    "data-start": start,
  }
  switch (gap.state) {
    case "empty": {
      const next = of.next === index
      return (
        <span
          {...shared}
          data-next={next}
          role="img"
          aria-label={next ? `${which}, next to fill` : which}
        >
          <span className="gap-bracket">[</span>{" "}
          <span className="gap-dots">{of.of === "words" ? "..." : "... ... ..."}</span>{" "}
          <span className="gap-bracket">]</span>
        </span>
      )
    }
    case "filled":
      return (
        <button
          {...shared}
          type="button"
          aria-label={`${gap.text}, in ${which}: take it back`}
          onClick={() => onEmpty?.(index)}
        >
          <span className="gap-bracket" aria-hidden="true">
            [
          </span>
          <span className="gap-word">{gap.text}</span>
          <span className="gap-bracket" aria-hidden="true">
            ]
          </span>
        </button>
      )
    case "restored":
      return <span {...shared}>{gap.text}</span>
    default:
      return assertNever(gap)
  }
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
