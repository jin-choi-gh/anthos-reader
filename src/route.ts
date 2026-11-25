import { useSyncExternalStore } from "react"

export type ModeName = "practice" | "annotate"

export type Route =
  | { screen: "library" }
  | { screen: "reader"; file: string; mode: ModeName }
  | { screen: "form"; file: string; fresh: boolean }

/** The current route, updated whenever the hash changes. */
export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, currentHash)
  return parseRoute(hash)
}

/** A hash as a route: #/read/<file> or #/read/<file>/annotate, a reader; #/form/<file>, Form Practice
 * for that file, and #/form/<file>/new, Form Practice starting a new practice for it; anything
 * else, the empty hash included, the library. */
export function parseRoute(hash: string): Route {
  const form = /^#\/form\/([^/]+)(\/new)?$/.exec(hash)
  const formFile = form?.[1]
  if (formFile !== undefined) {
    return { screen: "form", file: decodeURIComponent(formFile), fresh: form?.[2] !== undefined }
  }
  const match = /^#\/read\/([^/]+)(\/annotate)?$/.exec(hash)
  const file = match?.[1]
  if (file === undefined) return { screen: "library" }
  return {
    screen: "reader",
    file: decodeURIComponent(file),
    mode: match?.[2] ? "annotate" : "practice",
  }
}

export const libraryHref = "#/"

export function readerHref(file: string, mode: ModeName = "practice"): string {
  const base = `#/read/${encodeURIComponent(file)}`
  return mode === "annotate" ? `${base}/annotate` : base
}

export function formHref(file: string, fresh = false): string {
  const base = `#/form/${encodeURIComponent(file)}`
  return fresh ? `${base}/new` : base
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
