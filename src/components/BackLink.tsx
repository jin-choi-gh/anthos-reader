import type { ReactNode } from "react"
import { ChevronLeft } from "./icons"
import "./backLink.css"

/** The way back, at the left of the top bar: a chevron and where it leads ("Library"). */
export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className="back-link" href={href}>
      <ChevronLeft size={18} />
      {children}
    </a>
  )
}
