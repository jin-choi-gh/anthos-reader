import { useState, type ReactNode } from "react"
import "./bottomSheet.css"

/** A sheet over the foot of the page, folded down to its handle or open. It starts as `startsOpen`
 * says, and from then on is the reader's to fold and open. */
export function BottomSheet({
  label,
  startsOpen = false,
  children,
}: {
  label: string
  startsOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(startsOpen)

  return (
    <aside className="bottom-sheet" data-open={open}>
      <button
        type="button"
        className="bottom-sheet-handle"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {label}
      </button>
      <div className="bottom-sheet-body">{children}</div>
    </aside>
  )
}
