import { useSyncExternalStore } from "react"

export type ModeName = "practice" | "annotate"

export type Route = { screen: "library" } | { screen: "reader"; file: string; mode: ModeName }

/** The current route, updated whenever the hash changes. */
export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, currentHash)
  return parseRoute(hash)
}

/** A hash as a route. Anything that is not #/read/<file> or #/read/<file>/annotate, the empty hash included, is the library. */
export function parseRoute(hash: string): Route {
  const match = /^#\/read\/([^/]+)(\/annotate)?$/.exec(hash)
  if (!match) return { screen: "library" }
  return {
    screen: "reader",
    file: decodeURIComponent(match[1]),
    mode: match[2] ? "annotate" : "practice",
  }
}

export const libraryHref = "#/"

export function readerHref(file: string, mode: ModeName = "practice"): string {
  const base = `#/read/${encodeURIComponent(file)}`
  return mode === "annotate" ? `${base}/annotate` : base
}

export function replaceHref(href: string): void {
  window.location.replace(href)
}

function currentHash(): string {
  return window.location.hash
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("hashchange", onChange)
  return () => window.removeEventListener("hashchange", onChange)
}
