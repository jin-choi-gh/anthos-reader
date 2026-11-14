import { useMemo, type ReactNode } from "react"
import { Layout } from "./Layout"
import type { Material, Materials } from "../material/materials"
import { useNotebook } from "../notebook/useNotebook"
import { annotateFrame } from "./frame/frame"
import { useScene } from "./scenes/useScene"
import type { ReaderLayout } from "./usePlatform"
import { ViewerNotes, ViewerPage } from "./viewer/Viewer"

/** Annotate mode: the text's notebook, a frame on the reader's own notes, and its scene, all kept for
 * as long as the mode lasts. It reads the notebook, and follows it as it changes, but writes
 * nothing. */
export function AnnotateMode({
  text,
  material,
  materials,
  layout,
  topBar,
}: {
  text: string
  material: Material
  materials: Materials
  layout: ReaderLayout
  topBar: ReactNode
}) {
  const notebook = useNotebook(text)
  const frame = useMemo(
    () => annotateFrame(text, material, notebook.notes),
    [text, material, notebook.notes],
  )
  // Nothing is written in annotate mode yet, so the scene has nothing to send out
  const scene = useScene(frame.subject, ignore)
  const viewer = { projection: scene.viewer, materials, send: scene.toScene.viewer }

  return (
    <Layout
      layout={layout}
      topBar={topBar}
      page={<ViewerPage {...viewer} />}
      notes={<ViewerNotes {...viewer} />}
    />
  )
}

function ignore() {}
