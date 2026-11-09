import { useLayoutEffect, useState, useSyncExternalStore, type RefObject } from "react"

/** Where things go, from the reader's width: the page alone, or the page with a margin beside it. */
export type ReaderLayout = "page" | "spread"

/** How the reader is pointed at: by a finger, or by a mouse or trackpad. It decides how things are
 * chosen (word handles, or drag and shift-click), never where they are laid out. */
export type ReaderInput = "touch" | "mouse"

/** The two things the reader adapts to, and they vary apart: a narrow desktop window is a page
 * pointed at by a mouse, and a tablet held sideways is a spread pointed at by a finger. */
export interface Platform {
  layout: ReaderLayout // from the reader's width: page or spread
  input: ReaderInput // from the primary pointer: touch or mouse
}

export function usePlatform(ref: RefObject<HTMLElement | null>): Platform {
  return { layout: useLayout(ref), input: useInput() }
}

// Width of the reader itself, not the window: on the web the nav sidebar takes some of it
export const SPREAD_MIN_WIDTH = 900

function useLayout(ref: RefObject<HTMLElement | null>): ReaderLayout {
  const [layout, setLayout] = useState<ReaderLayout>("page")

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

function useInput(): ReaderInput {
  return useSyncExternalStore(subscribe, currentInput)
}

function currentInput(): ReaderInput {
  return window.matchMedia(COARSE).matches ? "touch" : "mouse"
}

function subscribe(onChange: () => void): () => void {
  const query = window.matchMedia(COARSE)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}
