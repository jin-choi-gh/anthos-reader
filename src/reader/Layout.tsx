import { useLayoutEffect, useRef, type ReactNode, type RefObject } from "react"
import { libraryHref } from "../route"
import { ChevronLeft } from "../ui/icons"
import { BottomSheet } from "./BottomSheet"
import { Margin } from "./Margin"
import type { ReaderLayout } from "./usePlatform"

/** Where the reader's parts go: the page in the text column, under the top bar (the way back to the
 * library, and whatever else the top bar is given), and beside it the notes and, in practice mode,
 * the praxis bar. Every mode places its parts here, so they are placed alike. */
export function Layout({
  layout,
  topBar,
  dev,
  page,
  notes,
  praxisBar,
}: {
  layout: ReaderLayout
  topBar?: ReactNode // beside the way back: the mode toggle
  dev?: ReactNode // under the top bar, in development only: the dev panel
  page: ReactNode
  notes: ReactNode
  praxisBar?: ReactNode // practice mode only
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
      <Beside layout={layout} notes={notes} praxisBar={praxisBar} />
    </>
  )
}

/** What goes beside the page. Annotate mode: the notes, in the margin or in the sheet with its
 * handle. Practice mode: the praxis bar and then the open note in the margin; or, on a page, the
 * praxis bar docked at the foot of the screen, with the open note in a sheet over it. */
function Beside({
  layout,
  notes,
  praxisBar,
}: {
  layout: ReaderLayout
  notes: ReactNode
  praxisBar?: ReactNode
}) {
  if (praxisBar === undefined) {
    if (layout === "spread") return <Margin>{notes}</Margin>
    return <BottomSheet label="Notes">{notes}</BottomSheet>
  }
  if (layout === "spread") {
    return (
      <Margin>
        {praxisBar}
        {notes}
      </Margin>
    )
  }
  return <Dock praxisBar={praxisBar} notes={notes} />
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
