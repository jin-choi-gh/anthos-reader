import { useEffect, useRef, useState } from "react"
import { loadVersion } from "../loom/load"
import { toPoem } from "../loom/toPoem"
import type { Poem } from "./types"
import { useLayout } from "./useLayout"
import { TitleBlock } from "./TitleBlock"
import { PoemBlock } from "./PoemBlock"
import { Margin } from "./Margin"
import { BottomSheet } from "./BottomSheet"
import "./reader.css"

export function Reader({ file }: { file: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const layout = useLayout(ref)
  const [poem, setPoem] = useState<Poem | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    loadVersion(file)
      .then((version) => {
        if (!cancelled) setPoem(toPoem(version))
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      })
    return () => {
      cancelled = true
    }
  }, [file])

  return (
    <div ref={ref} className="reader" data-layout={layout}>
      <article className="reader-text">
        <div className="text-block">
          {error !== null ? (
            <p className="reader-message">{error}</p>
          ) : poem === null ? (
            <p className="reader-message">Loading…</p>
          ) : (
            <>
              <TitleBlock poem={poem} />
              <PoemBlock poem={poem} />
            </>
          )}
        </div>
      </article>
      {layout === "spread" ? (
        <Margin />
      ) : (
        <BottomSheet label="Notes">
          <p className="margin-empty">Notes will appear here.</p>
        </BottomSheet>
      )}
    </div>
  )
}
