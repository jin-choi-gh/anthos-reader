import type { ReactNode } from "react"
import { BackLink } from "../components/BackLink"
import { BottomSheet } from "../components/BottomSheet"
import { Dock } from "../components/Dock"
import { FolioText } from "../components/Folio"
import { Margin } from "../components/Margin"
import type { PageOrSpread } from "../components/usePlatform"
import { LightToggle } from "../LightToggle"
import { libraryHref } from "../route"

/** Where the reader's parts go: the page in the poem's column, under the top bar (the way back to
 * the library, whatever else the top bar is given, and the light toggle), and beside it the notes
 * and the praxis bar. The notes are either one open note ("open"), or a list to look through
 * ("list"). Every mode places its parts here, so they are placed alike. */
export function Layout({
  layout,
  topBar,
  dev,
  page,
  notes,
  notesAs = "open",
  notesLabel = "Notes",
  notesOpen = false,
  praxisBar,
}: {
  layout: PageOrSpread
  topBar?: ReactNode // beside the way back: the mode toggle
  dev?: ReactNode // under the top bar, in development only: the dev panel
  page: ReactNode
  notes: ReactNode
  notesAs?: "open" | "list"
  notesLabel?: string // the handle of the notes' sheet, on a page
  notesOpen?: boolean // whether the notes' sheet, on a page, starts open
  praxisBar?: ReactNode
}) {
  return (
    <>
      <FolioText
        top={
          <>
            <BackLink href={libraryHref}>Library</BackLink>
            <div className="folio-tools">
              {topBar}
              <LightToggle />
            </div>
          </>
        }
        under={dev}
      >
        {page}
      </FolioText>
      <Beside
        layout={layout}
        notes={notes}
        notesAs={notesAs}
        notesLabel={notesLabel}
        notesOpen={notesOpen}
        praxisBar={praxisBar}
      />
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
  notesLabel,
  notesOpen,
  praxisBar,
}: {
  layout: PageOrSpread
  notes: ReactNode
  notesAs: "open" | "list"
  notesLabel: string
  notesOpen: boolean
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
  if (praxisBar === undefined) {
    return (
      <BottomSheet label={notesLabel} startsOpen={notesOpen}>
        {notes}
      </BottomSheet>
    )
  }
  if (notesAs === "open") return <Dock sheet={notes}>{praxisBar}</Dock>
  return (
    <>
      <Dock>{praxisBar}</Dock>
      <BottomSheet label={notesLabel} startsOpen={notesOpen}>
        {notes}
      </BottomSheet>
    </>
  )
}
