import { useLayoutEffect, useState, useSyncExternalStore, type RefObject } from "react"

/** Where things go, from the folio's width: the page alone, or the page with a margin beside it. */
export type PageOrSpread = "page" | "spread"

/** How the app is mostly pointed at, by the primary pointer: a finger, or a mouse or trackpad.
 * It is marked on the folio (data-input) and decides nothing else: how a passage is chosen goes
 * by the pointer of each press (CHOOSING, in viewer/choosing.ts), and where things go by the width. */
export type Pointer = "touch" | "mouse"

/** The folio's width and its primary pointer, which vary apart: a narrow desktop window is a page
 * pointed at by a mouse, and a tablet held sideways is a spread pointed at by a finger. */
export interface Platform {
  layout: PageOrSpread // from the folio's width: page or spread
  input: Pointer // from the primary pointer: touch or mouse
}

export function usePlatform(ref: RefObject<HTMLElement | null>): Platform {
  return { layout: useLayout(ref), input: useInput() }
}

// Width of the folio itself, not the window: on the web the nav sidebar takes some of it
export const SPREAD_MIN_WIDTH = 900

function useLayout(ref: RefObject<HTMLElement | null>): PageOrSpread {
  const [layout, setLayout] = useState<PageOrSpread>("page")

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setLayout(el.clientWidth >= SPREAD_MIN_WIDTH ? "spread" : "page")
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])

  return layout
}

// The primary pointer is coarse on phones and tablets, fine with a mouse or trackpad, even on a
// laptop that also has a touchscreen
const COARSE = "(pointer: coarse)"

function useInput(): Pointer {
  return useSyncExternalStore(subscribe, currentInput)
}

function currentInput(): Pointer {
  return window.matchMedia(COARSE).matches ? "touch" : "mouse"
}

function subscribe(onChange: () => void): () => void {
  const query = window.matchMedia(COARSE)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}
