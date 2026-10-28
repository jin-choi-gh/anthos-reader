import { useLayoutEffect, useState, type RefObject } from "react"

export type ReaderLayout = "page" | "spread"

// Width of the reader itself, not the window: on the web the nav sidebar takes some of it
export const SPREAD_MIN_WIDTH = 900

export function useLayout(ref: RefObject<HTMLElement | null>): ReaderLayout {
  const [layout, setLayout] = useState<ReaderLayout>("page")

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () =>
      setLayout(el.clientWidth >= SPREAD_MIN_WIDTH ? "spread" : "page")
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])

  return layout
}
