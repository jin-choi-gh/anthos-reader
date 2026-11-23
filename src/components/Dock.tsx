import { useLayoutEffect, useRef, type ReactNode, type RefObject } from "react"
import "./dock.css"

/** What is docked at the foot of a page, edge to edge, and, over it, a sheet, when one is given.
 * Its height is kept in --dock-height, so the page leaves room for it. */
export function Dock({ children, sheet = null }: { children: ReactNode; sheet?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useHeightVariable(ref, "--dock-height")
  return (
    <div className="dock" ref={ref}>
      {children}
      {sheet !== null && <DockSheet>{sheet}</DockSheet>}
    </div>
  )
}

/** The sheet over what is docked. Its height is kept in --dock-sheet-height while it is open, so
 * what scrolls into view stops above it. */
function DockSheet({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useHeightVariable(ref, "--dock-sheet-height")
  return (
    <div className="dock-sheet" ref={ref}>
      {children}
    </div>
  )
}

/** Keeps a CSS variable on the page's root at an element's height, for as long as the element is
 * there. Set before the page is painted, and before any effect scrolls the poem by it. */
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
