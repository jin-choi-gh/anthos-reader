import { useCallback, useEffect, useMemo, useRef } from "react"
import { loadTextualComplex } from "../loom/load"
import { toMaterial } from "../loom/toMaterial"
import { practiceFor } from "../practice/practices"
import type { ModeName } from "../route"
import { useLoaded } from "../useLoaded"
import { AnnotateMode } from "./AnnotateMode"
import { Layout } from "./Layout"
import type { Material } from "../material/materials"
import { modeOf } from "./mode"
import { ModeToggle } from "./ModeToggle"
import { PracticeMode } from "./PracticeMode"
import { usePlatform } from "./usePlatform"
import "./reader.css"

/** One file's material, made from its textual complex. */
async function loadMaterial(file: string): Promise<Material> {
  return toMaterial(await loadTextualComplex(file))
}

/** The reader of one file, for its whole life: App gives it a key of its file, so another file is
 * another reader, and nothing in one carries over to the next. It loads the file's material, keeps
 * the layout, and picks the mode from the one asked for. */
export function Reader({ file, mode: asked }: { file: string; mode: ModeName }) {
  const ref = useRef<HTMLDivElement>(null)
  const { layout, input } = usePlatform(ref)
  const { value: material, error } = useLoaded(file, loadMaterial)

  // The tab names the poem while it is open, and goes back to what it said when the reader closes
  useEffect(() => {
    if (material === null) return
    const previous = document.title
    document.title = `${material.poem.title} · Anthos`
    return () => {
      document.title = previous
    }
  }, [material])

  // The texts the viewer can draw: for now, only this reader's own file
  const materials = useCallback(
    (text: string) => (text === file ? material : null),
    [file, material],
  )

  // The mode asked for, if the text's practice can run; otherwise annotate mode, and why not
  const chosen = useMemo(
    () => (material === null ? null : modeOf(asked, practiceFor(file), material.notes.notes)),
    [asked, file, material],
  )

  // In development, say why a text's practice cannot run
  useEffect(() => {
    if (!import.meta.env.DEV || chosen === null) return
    for (const problem of chosen.problems) console.warn(`The practice for ${file}: ${problem}`)
  }, [chosen, file])

  let content
  if (material === null || chosen === null) {
    // Loading, or the load failed
    content = (
      <Layout
        layout={layout}
        page={<p className="reader-message">{error ?? "Loading…"}</p>}
        notes={null}
      />
    )
  } else {
    const { mode } = chosen
    // The pen, only when there is a practice to switch to or from
    const topBar = mode.practice !== null && <ModeToggle file={file} mode={mode.name} />
    const parts = { material, materials, layout, topBar }
    content =
      mode.name === "practice" ? (
        <PracticeMode practice={mode.practice} {...parts} />
      ) : (
        <AnnotateMode text={file} {...parts} />
      )
  }

  return (
    <div ref={ref} className="reader" data-layout={layout} data-input={input}>
      {content}
    </div>
  )
}
