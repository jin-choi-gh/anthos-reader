import { useRef, type ReactNode } from "react"
import { useScrolls } from "./useScrolls"
import "./margin.css"

/** The spread layout's margin beside the poem's column: a place to put things, which knows nothing of
 * notes. It is as tall as the window allows, and scrolls what it holds, with no scrollbar: its top
 * and bottom edges fade while more lies beyond them. */
export function Margin({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null)
  const content = useRef<HTMLDivElement>(null)
  useScrolls(ref, content)
  return (
    <aside className="margin" ref={ref}>
      <div className="margin-content" ref={content}>
        {children}
      </div>
    </aside>
  )
}
