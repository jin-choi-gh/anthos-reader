import { useState, type ReactNode } from "react"

export function BottomSheet({ label, children }: { label: string, children: ReactNode}) {
  const [open, setOpen] = useState(false)

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