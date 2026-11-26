import { useRef, type ReactNode } from "react"
import { useScrolls } from "./useScrolls"
import "./margin.css"

/** The spread layout's margin beside the poem's column: a place to put things, which knows nothing of notes. */
export function Margin({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null)
  useScrolls(ref)
  return (
    <aside className="margin" ref={ref}>
      {children}
    </aside>
  )
}
