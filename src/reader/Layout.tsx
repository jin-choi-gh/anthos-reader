import { useLayoutEffect, useRef, type ReactNode, type RefObject } from "react"
import { libraryHref } from "../route"
import { ChevronLeft } from "../ui/icons"
import { BottomSheet } from "./BottomSheet"
import { Margin } from "./Margin"
import type { ReaderLayout } from "./usePlatform"

/** Where the reader's parts go: the page in the text column, under the top bar (the way back to the
 * library, and whatever else the top bar is given), and beside it the notes and the praxis bar.
 * The notes are either one open note ("open"), or a list to look through ("list"). Every mode places
 * its parts here, so they are placed alike. */
export function Layout({
  layout,
  topBar,
  dev,
  page,
  notes,
  notesAs = "open",
  praxisBar,
}: {
  layout: ReaderLayout
  topBar?: ReactNode // beside the way back: the mode toggle
  dev?: ReactNode // under the top bar, in development only: the dev panel
  page: ReactNode
  notes: ReactNode
  notesAs?: "open" | "list"
  praxisBar?: ReactNode
}) {
  return (
    <>
      <article className="reader-text">
        <div className="reader-top">
          <a className="reader-back" href={libraryHref}>
            <ChevronLeft size={18} />
            Library
          </a>
          {topBar}
        </div>
        {dev}
        <div className="text-block">{page}</div>
      </article>
      <Beside layout={layout} notes={notes} notesAs={notesAs} praxisBar={praxisBar} />
    </>
  )
}

/** What goes beside the page. On a spread, the margin: the praxis bar, if any, then the notes. On a
 * page, the praxis bar, if any, docked at the foot of the screen; an open note in a sheet over it;
 * a list of notes in the sheet with its handle, just above the docked bar. */
function Beside({
  layout,
  notes,
  notesAs,
  praxisBar,
}: {
  layout: ReaderLayout
  notes: ReactNode
  notesAs: "open" | "list"
  praxisBar?: ReactNode
}) {
  if (layout === "spread") {
    return (
      <Margin>
        {praxisBar}
        {notes}
      </Margin>
    )
  }
  if (praxisBar === undefined) return <BottomSheet label="Notes">{notes}</BottomSheet>
  if (notesAs === "open") return <Dock praxisBar={praxisBar} notes={notes} />
  return (
    <>
      <Dock praxisBar={praxisBar} notes={null} />
      <BottomSheet label="Notes">{notes}</BottomSheet>
    </>
  )
}

/** The praxis bar docked at the foot of the screen, and the open note, if any, in a sheet that covers
 * it. Its height is kept in --praxis-bar-height, so the page leaves room for it. */
function Dock({ praxisBar, notes }: { praxisBar: ReactNode; notes: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useHeightVariable(ref, "--praxis-bar-height")
  return (
    <div className="praxis-dock" ref={ref}>
      {praxisBar}
      {notes !== null && <NoteSheet>{notes}</NoteSheet>}
    </div>
  )
}

/** The open note's sheet, over the praxis bar. Its height is kept in --note-sheet-height while it is
 * open, so what scrolls into view stops above it. */
function NoteSheet({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useHeightVariable(ref, "--note-sheet-height")
  return (
    <div className="note-sheet" ref={ref}>
      {children}
    </div>
  )
}

/** Keeps a CSS variable on the page's root at an element's height, for as long as the element is
 * there. Set before the screen is painted, and before any effect scrolls the poem by it. */
function useHeightVariable(ref: RefObject<HTMLElement | null>, name: string) {
  useLayoutEffect(() => {
    const element = ref.current
    if (element === null) return
    const root = document.documentElement.style
    const update = () => root.setProperty(name, `${element.offsetHeight}px`)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => {
      observer.disconnect()
      root.removeProperty(name)
    }
  }, [ref, name])
}
