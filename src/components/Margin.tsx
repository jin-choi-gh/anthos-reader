import type { ReactNode } from "react"
import "./margin.css"

/** The spread layout's margin beside the poem's column: a place to put things, which knows nothing of notes. */
export function Margin({ children }: { children: ReactNode }) {
  return <aside className="margin">{children}</aside>
}
