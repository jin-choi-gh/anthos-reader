import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type RefObject,
} from "react"
import { Lemma } from "../../components/Lemma"
import type { PageOrSpread } from "../../components/usePlatform"
import type { DisclosedNote, DisclosureProjection } from "../scenes/types"
import { formOf, scrolledToShow } from "./disclosedForm"
import { typedOf } from "./typing"
import type { Disclosing, Typing } from "./useDisclosing"

/** The notes disclosed, in the praxis bar. On a spread, every note disclosed, in full, in order, each
 * in a box of its own, the same in every state: the one being read, whose words are lit in the poem,
 * is only filled, so that reading another moves nothing; a note clicked is read again. The margin
 * scrolls when they outgrow it, and is brought to a note disclosed, and to the buttons under it. On a
 * page, the note being read, with no lemma, and under it, just above the buttons, where nothing
 * moves, the notes so far as a row of numbers (none for a step of one note); a swipe on the note goes
 * to the note before or after, and, at the newest, discloses the next. A note typing is shown whole
 * by a tap on it. Anywhere else on the page, Space or the right arrow goes forward, and the left arrow
 * back. Each note the reader comes to is said once, whole, to assistive technology. */
export function DisclosedNotes({
  disclosure,
  disclosing,
  layout,
}: {
  disclosure: DisclosureProjection
  disclosing: Disclosing
  layout: PageOrSpread
}) {
  useKeys(disclosing)
  const said = useSaid(disclosure)
  const form = formOf(layout, disclosure.count)
  const { current } = disclosure
  const status = (
    <p className="disclosed-said" role="status">
      {said}
    </p>
  )
  if (current === null) return status
  return (
    <div className="disclosed" data-layout={layout}>
      {form === "list" ? (
        <NoteList disclosure={disclosure} disclosing={disclosing} />
      ) : (
        <>
          <Reading disclosure={disclosure} current={current} disclosing={disclosing} />
          {form === "numbers" && <NoteNumbers disclosure={disclosure} disclosing={disclosing} />}
        </>
      )}
      {status}
    </div>
  )
}

/** On a spread: every note disclosed, in full, the one being read filled; a click on a note reads it
 * again. A note disclosed brings the margin to the end, where it is, just above the buttons; a note
 * read again by the keyboard is brought into view in the margin, if it is out of it. Only the margin
 * scrolls, never the page. The list is one stop for Tab, on the lemma of the note being read, and the
 * arrow keys move from note to note. */
function NoteList({
  disclosure,
  disclosing,
}: {
  disclosure: DisclosureProjection
  disclosing: Disclosing
}) {
  const list = useRef<HTMLOListElement>(null)
  const { notes, current } = disclosure
  const count = notes.length
  const before = useRef({ key: disclosure.key, count })
  useFocusFollows(list, current)

  useLayoutEffect(() => {
    const was = before.current
    before.current = { key: disclosure.key, count }
    const margin = scrollerOf(list.current)
    const note = current === null ? null : list.current?.children[current]
    if (margin === null || !(note instanceof HTMLElement)) return
    if (was.key === disclosure.key && count > was.count) {
      margin.scrollTo({
        top: margin.scrollHeight,
        behavior: prefersReducedMotion() ? "auto" : "smooth",
      })
      return
    }
    const box = note.getBoundingClientRect()
    const view = margin.getBoundingClientRect()
    if (box.top < view.top) margin.scrollTop -= view.top - box.top
    else if (box.bottom > view.bottom) {
      margin.scrollTop += Math.min(box.bottom - view.bottom, box.top - view.top)
    }
  }, [disclosure.key, count, current])

  return (
    <ol className="disclosed-list" ref={list} aria-label="Notes disclosed">
      {notes.map((note, place) => (
        // The whole note reads it again to a pointer; its lemma, a button, to the keyboard
        <li
          key={note.index}
          className="disclosed-note"
          data-current={place === current}
          onClick={() => disclosing.turn(place)}
        >
          <button
            type="button"
            className="disclosed-lemma"
            aria-current={place === current}
            tabIndex={place === current ? 0 : -1}
            onKeyDown={(event) => moveByKey(event, disclosing)}
          >
            <Lemma lemma={note.lemma} />
            <span className="note-close-mark" aria-hidden="true">
              {" ]"}
            </span>
          </button>
          <NoteBody note={note} typing={typingAt(disclosing.typing, place)} />
        </li>
      ))}
    </ol>
  )
}

/** The nearest ancestor that scrolls on its own, as the margin does. */
function scrollerOf(element: Element | null): HTMLElement | null {
  for (let at = element?.parentElement ?? null; at !== null; at = at.parentElement) {
    const { overflowY } = getComputedStyle(at)
    if (overflowY === "auto" || overflowY === "scroll") return at
  }
  return null
}

function typingAt(typing: Typing | null, place: number): Typing | null {
  return typing !== null && typing.note === place ? typing : null
}

/** The notes so far as numbers, the one being read filled; a tap reads it again. One line, scrolled
 * sideways when it does not fit, its edges faded where numbers are hidden, with ‹ › at its ends only
 * then, which move the row, never the note being read; the number being read is kept in view, clear
 * of the faded edges. The row is one stop for Tab, and the arrow keys move from note to note. */
function NoteNumbers({
  disclosure,
  disclosing,
}: {
  disclosure: DisclosureProjection
  disclosing: Disclosing
}) {
  const row = useRef<HTMLDivElement>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const { notes, current } = disclosure
  useFocusFollows(track, current)

  // What the row shows is measured, and marked on it, not kept as state: whether the numbers
  // outgrow the row, judged against the whole row, which the arrows do not narrow, so that they
  // never come and go of themselves; and whether the row is at either end. Then the number being
  // read is brought into view, once the arrows have taken their room
  useLayoutEffect(() => {
    const show = () => {
      const r = row.current
      const s = scroller.current
      const t = track.current
      if (r === null || s === null || t === null) return
      r.dataset.overflows = String(t.offsetWidth > r.clientWidth + 1)
      const now = t.querySelector<HTMLElement>('[aria-current="true"]')
      if (now !== null) {
        const start = now.getBoundingClientRect().left - t.getBoundingClientRect().left
        const item = { start, end: start + now.offsetWidth }
        const view = { left: s.scrollLeft, width: s.clientWidth, total: s.scrollWidth }
        s.scrollLeft = scrolledToShow(item, view, FADE_PX)
      }
      ends(r, s)
    }
    show()
    const observer = new ResizeObserver(show)
    if (row.current !== null) observer.observe(row.current)
    if (track.current !== null) observer.observe(track.current)
    return () => observer.disconnect()
  }, [current, notes.length])

  const page = (way: -1 | 1) => {
    const s = scroller.current
    if (s === null) return
    const behavior = prefersReducedMotion() ? "auto" : "smooth"
    s.scrollBy({ left: way * s.clientWidth * PAGE, behavior })
  }

  return (
    <div className="disclosed-row" ref={row}>
      <button
        type="button"
        className="disclosed-arrow"
        data-way="earlier"
        aria-label="Earlier notes"
        tabIndex={-1}
        onClick={() => page(-1)}
      >
        ‹
      </button>
      <div
        className="disclosed-scroller"
        ref={scroller}
        onScroll={() => {
          if (row.current !== null && scroller.current !== null) {
            ends(row.current, scroller.current)
          }
        }}
      >
        <div className="disclosed-numbers" ref={track} role="group" aria-label="Notes disclosed">
          {notes.map((note, place) => (
            <button
              key={note.index}
              type="button"
              className="disclosed-number"
              aria-current={place === current}
              aria-label={`Note ${place + 1}: ${lemmaText(note)}`}
              tabIndex={place === current ? 0 : -1}
              onClick={() => disclosing.turn(place)}
              onKeyDown={(event) => moveByKey(event, disclosing)}
            >
              {place + 1}
            </button>
          ))}
        </div>
      </div>
      <button
        type="button"
        className="disclosed-arrow"
        data-way="later"
        aria-label="Later notes"
        tabIndex={-1}
        onClick={() => page(1)}
      >
        ›
      </button>
    </div>
  )
}

// How far the number being read is kept from the row's faded edges, which are as wide
const FADE_PX = 28
// How much of the row's width an arrow moves it
const PAGE = 0.8

/** Marks on the row whether it is scrolled to either end, for its fades and its arrows. */
function ends(row: HTMLElement, scroller: HTMLElement) {
  const { scrollLeft, clientWidth, scrollWidth } = scroller
  row.dataset.start = String(scrollLeft <= 1)
  row.dataset.end = String(scrollLeft + clientWidth >= scrollWidth - 1)
}

/** On a page, the note being read, with no lemma, as tall as it is. A tap on a note typing shows it
 * whole; a swipe across it goes to the note after, or before, and, at the newest, discloses the
 * next. */
function Reading({
  disclosure,
  current,
  disclosing,
}: {
  disclosure: DisclosureProjection
  current: number
  disclosing: Disclosing
}) {
  const from = useRef<{ x: number; y: number } | null>(null)
  // A swipe ends in a click, which is not a tap on the note
  const swipedAt = useRef(-Infinity)
  const note = disclosure.notes[current]
  if (note === undefined) return null

  const onPointerDown = (event: PointerEvent) => {
    from.current = { x: event.clientX, y: event.clientY }
  }
  const onPointerUp = (event: PointerEvent) => {
    const start = from.current
    from.current = null
    if (start === null) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) < Math.abs(dy)) return
    swipedAt.current = performance.now()
    if (dx < 0) disclosing.forward()
    else disclosing.back()
  }
  const typing = typingAt(disclosing.typing, current)

  return (
    // A tap on a note typing shows it whole; the keyboard does so with Space
    <div
      className="disclosed-reading"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (from.current = null)}
      onClick={() => {
        if (typing !== null && performance.now() - swipedAt.current > SWIPE_CLICK_MS) {
          disclosing.turn(current)
        }
      }}
    >
      <NoteBody note={note} typing={typing} />
    </div>
  )
}

// How far a pointer must move across, more than up or down, to be a swipe
const SWIPE_PX = 40
// How soon after a swipe a click is the swipe's own
const SWIPE_CLICK_MS = 400

/** A note's paragraphs. While it types, the whole note is there, unseen but read by assistive
 * technology, and keeping the place it will take, so that nothing moves as it types; over it, what
 * is typed so far, with a caret. */
function NoteBody({ note, typing }: { note: DisclosedNote; typing: Typing | null }) {
  const typed = typing === null ? [] : typedOf(note.paragraphs, typing.typed)
  return (
    <div className="disclosed-body" data-typing={typing !== null}>
      {note.paragraphs.map((paragraph, i) => (
        <p key={i}>{paragraph}</p>
      ))}
      {typing !== null && (
        <div className="disclosed-typed" aria-hidden="true">
          {(typed.length === 0 ? [""] : typed).map((paragraph, i, all) => (
            <p key={i}>
              {paragraph}
              {i === all.length - 1 && <span className="disclosed-caret" />}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

/** The arrow keys on a note of the list or the row: back to the note before, or forward to the
 * note after, or, at the newest, the next disclosed. */
function moveByKey(event: KeyboardEvent<HTMLElement>, disclosing: Disclosing) {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
  if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
    event.preventDefault()
    disclosing.back()
  } else if (event.key === "ArrowRight" || event.key === "ArrowDown") {
    event.preventDefault()
    disclosing.forward()
  }
}

/** While the keyboard's focus is on a note of the list or the row, it goes with the note being
 * read, so that the arrow keys carry it from note to note. */
function useFocusFollows(within: RefObject<HTMLElement | null>, current: number | null) {
  useLayoutEffect(() => {
    const element = within.current
    if (element === null || !element.contains(document.activeElement)) return
    const now = element.querySelector<HTMLElement>('[aria-current="true"]')
    if (now !== null && now !== document.activeElement) now.focus({ preventScroll: true })
  }, [within, current])
}

function lemmaText(note: DisclosedNote): string {
  return note.lemma.map((part) => part.text).join(" · ")
}

/** Space or the right arrow goes forward, and the left arrow back, when nothing else on the page is
 * meant: not in a field or on a control, which answers keys of its own, and not with a modifier. */
function useKeys(disclosing: Disclosing) {
  const latest = useRef(disclosing)
  useLayoutEffect(() => {
    latest.current = disclosing
  })
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return
      if (event.shiftKey) return
      const target = event.target
      if (target instanceof Element && target.closest(CONTROLS) !== null) return
      if (event.key === " " || event.key === "ArrowRight") {
        event.preventDefault()
        latest.current.forward()
      } else if (event.key === "ArrowLeft") {
        event.preventDefault()
        latest.current.back()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])
}

// What answers keys of its own
const CONTROLS =
  'input, textarea, select, button, a[href], [contenteditable="true"], [role="button"], [role="dialog"]'

/** What is said to assistive technology: the note the reader has just come to, by disclosing it or
 * turning to it, its lemma and its words; nothing for what is there when a step is first drawn. */
function useSaid(disclosure: DisclosureProjection): string {
  const { key, current } = disclosure
  const [seen, setSeen] = useState({ key, current, said: "" })
  if (seen.key !== key || seen.current !== current) {
    const note = current === null ? undefined : disclosure.notes[current]
    setSeen({ key, current, said: seen.key !== key || note === undefined ? "" : saidOf(note) })
  }
  return seen.said
}

/** A note as it is said: its lemma, then its words. */
function saidOf(note: DisclosedNote): string {
  return `${lemmaText(note)}: ${note.paragraphs.join(" ")}`
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}
