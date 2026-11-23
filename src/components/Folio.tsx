import type { ReactNode, Ref } from "react"
import type { PageOrSpread, Pointer } from "./usePlatform"
import "./folio.css"

/** The poem's column and, on a spread, the margin beside it: the grid that holds them, marked with
 * the layout and the primary pointer, and leaving room on a page for whatever is docked at its foot.
 * `ref` is what usePlatform measures; `className` lets what holds it arrange it further. */
export function Folio({
  ref,
  layout,
  input,
  className,
  children,
}: {
  ref?: Ref<HTMLDivElement>
  layout: PageOrSpread
  input: Pointer
  className?: string
  children: ReactNode
}) {
  const classes = className === undefined ? "folio" : `folio ${className}`
  return (
    <div ref={ref} className={classes} data-layout={layout} data-input={input}>
      {children}
    </div>
  )
}

/** The poem's column: its top bar (the way back on the left, and whatever is given for the right),
 * what goes under the bar, and the page. */
export function FolioText({
  top,
  under,
  children,
}: {
  top: ReactNode
  under?: ReactNode
  children: ReactNode
}) {
  return (
    <article className="folio-text">
      <div className="folio-top">{top}</div>
      {under}
      <div className="folio-page">{children}</div>
    </article>
  )
}

/** A word in the column in place of the poem: "Loading…", or why the text could not be loaded. */
export function Message({ children }: { children: ReactNode }) {
  return <p className="folio-message">{children}</p>
}
