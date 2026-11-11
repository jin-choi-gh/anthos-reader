import { useCallback, useEffect, useRef } from "react"
import { loadTextualComplex } from "../loom/load"
import { toNotes } from "../loom/toNotes"
import { toPoem } from "../loom/toPoem"
import { useLoaded } from "../useLoaded"
import { AnnotateMode } from "./AnnotateMode"
import { Layout } from "./Layout"
import type { Material } from "./materials"
import { usePlatform } from "./usePlatform"
import "./reader.css"

/** One file's material: its poem and its notes, made together from its textual complex. */
async function loadMaterial(file: string): Promise<Material> {
  const textualComplex = await loadTextualComplex(file)
  return { poem: toPoem(textualComplex), notes: toNotes(textualComplex) }
}

/** The reader of one file, for its whole life: App gives it a key of its file, so another file is
 * another reader, and nothing in one carries over to the next. It loads the file's material and
 * keeps the layout; the mode draws the material, and holds the frame and the scene. */
export function Reader({ file }: { file: string }) {
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

  return (
    <div ref={ref} className="reader" data-layout={layout} data-input={input}>
      {material === null ? (
        <Layout
          layout={layout}
          page={<p className="reader-message">{error ?? "Loading…"}</p>}
          notes={null}
        />
      ) : (
        <AnnotateMode
          text={file}
          notes={material.notes.notes}
          materials={materials}
          layout={layout}
        />
      )}
    </div>
  )
}
