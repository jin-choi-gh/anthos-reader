import { useSyncExternalStore } from "react"

/** Which screen shows, read from the URL hash: #/ is the library, #/read/dickinson reads
 * text-data/dickinson.json. Keeping it in the hash means a reload stays put, and the browser's
 * back button (and Android's, which walks the web view's history) goes back a screen. */
export type Route = { screen: "library" } | { screen: "reader"; file: string }

/** The current route, updated whenever the hash changes. */
export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, currentHash)
  return parseRoute(hash)
}

/** A hash as a route. Anything that is not #/read/<file>, the empty hash included, is the library. */
export function parseRoute(hash: string): Route {
  const match = /^#\/read\/(.+)$/.exec(hash)
  return match ? { screen: "reader", file: decodeURIComponent(match[1]) } : { screen: "library" }
}

export const libraryHref = "#/"

export function readerHref(file: string): string {
  return `#/read/${encodeURIComponent(file)}`
}

function currentHash(): string {
  return window.location.hash
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("hashchange", onChange)
  return () => window.removeEventListener("hashchange", onChange)
}
