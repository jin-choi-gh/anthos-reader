import type { ReactNode } from "react"
import { libraryHref } from "../route"
import { ChevronLeft } from "../ui/icons"
import { BottomSheet } from "./BottomSheet"
import { Margin } from "./Margin"
import type { ReaderLayout } from "./usePlatform"

/** Where the reader's parts go: the page in the text column, under the way back to the library; the
 * notes in the margin on a spread, or in the sheet on a page. Every mode places its parts here, so
 * they are placed alike. */
export function Layout({
  layout,
  page,
  notes,
}: {
  layout: ReaderLayout
  page: ReactNode
  notes: ReactNode
}) {
  return (
    <>
      <article className="reader-text">
        <a className="reader-back" href={libraryHref}>
          <ChevronLeft size={18} />
          Library
        </a>
        <div className="text-block">{page}</div>
      </article>
      {layout === "spread" ? (
        <Margin>{notes}</Margin>
      ) : (
        <BottomSheet label="Notes">{notes}</BottomSheet>
      )}
    </>
  )
}
