import { useSyncExternalStore } from "react"
import { readValue, writeValue } from "./storage/value"

/** What the app is shown in: light, or dark. */
export type Light = "light" | "dark"

export const LIGHT_KEY = "anthos.v1.light"

const DARK = "(prefers-color-scheme: dark)"

// What the reader chose, null until they choose. Kept here as well as in storage, so that a choice
// holds until the page is left even when storage is off
let chosen: Light | null = null
const listeners = new Set<() => void>()

export function isLight(value: unknown): value is Light {
  return value === "light" || value === "dark"
}

/** The light to show: the reader's choice, or the system's when they have made none. */
export function lightIn(choice: Light | null, systemIsDark: boolean): Light {
  return choice ?? (systemIsDark ? "dark" : "light")
}

/** Takes up the choice kept in the browser, and from then on any made in another tab. Called once,
 * before the first render, so that nothing is drawn in the wrong light first. */
export function openLight(): void {
  take(readValue(LIGHT_KEY, isLight))
  window.addEventListener("storage", (event) => {
    // A null key is the whole storage cleared
    if (event.key === LIGHT_KEY || event.key === null) take(readValue(LIGHT_KEY, isLight))
  })
}

/** Shows the app in this light, and keeps the choice. */
export function chooseLight(light: Light): void {
  writeValue(LIGHT_KEY, light)
  take(light)
}

/** The light the app is shown in, updated when the reader chooses or the system changes. */
export function useLight(): Light {
  return useSyncExternalStore(subscribe, currentLight)
}

/** Marks the document with a choice, for the theme, or takes the mark away when there is none. */
function take(choice: Light | null): void {
  chosen = choice
  if (choice === null) delete document.documentElement.dataset.light
  else document.documentElement.dataset.light = choice
  for (const listener of listeners) listener()
}

function currentLight(): Light {
  return lightIn(chosen, window.matchMedia(DARK).matches)
}

function subscribe(onChange: () => void): () => void {
  const query = window.matchMedia(DARK)
  query.addEventListener("change", onChange)
  listeners.add(onChange)
  return () => {
    query.removeEventListener("change", onChange)
    listeners.delete(onChange)
  }
}
