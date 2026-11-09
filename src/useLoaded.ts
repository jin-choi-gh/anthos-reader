import { useEffect, useState } from "react"

/** What a load has given so far: both null while it runs, then its value or why it failed. */
export interface Loaded<T> {
  value: T | null
  error: string | null
}

/** The result of load(key), loaded on mount and again whenever key changes. Until the load for the
 * current key settles, value and error are both null, so a screen never shows what it loaded for an
 * earlier key. A load that settles after its key has changed, or after unmount, is dropped.
 *
 * load is a dependency of the effect, so define it outside the component: a function made during
 * render is new on every render, and would load again every time. */
export function useLoaded<T>(key: string, load: (key: string) => Promise<T>): Loaded<T> {
  const [settled, setSettled] = useState<({ key: string } & Loaded<T>) | null>(null)

  useEffect(() => {
    let cancelled = false
    load(key).then(
      (value) => {
        if (!cancelled) setSettled({ key, value, error: null })
      },
      (e: unknown) => {
        if (!cancelled)
          setSettled({ key, value: null, error: e instanceof Error ? e.message : String(e) })
      },
    )
    return () => {
      cancelled = true
    }
  }, [key, load])

  return settled !== null && settled.key === key ? settled : { value: null, error: null }
}
