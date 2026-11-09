import { useSyncExternalStore, type RefObject } from "react"
import { useLayout, type ReaderLayout } from "./useLayout"

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
