import { useMemo, type ReactNode } from "react"
import { Layout } from "./Layout"
import type { Materials } from "../material/materials"
import { annotateFrame } from "./frame/frame"
import { useScene } from "./scenes/useScene"
import type { Note } from "../material/types"
import type { ReaderLayout } from "./usePlatform"
import { ViewerNotes, ViewerPage } from "./viewer/Viewer"

/** Annotate mode: a frame on all the text's notes, and its scene, both kept for as long as the mode
 * lasts. */
export function AnnotateMode({
  text,
  notes,
  materials,
  layout,
  topBar,
}: {
  text: string
  notes: Note[]
  materials: Materials
  layout: ReaderLayout
  topBar: ReactNode
}) {
  const frame = useMemo(() => annotateFrame(text, notes), [text, notes])
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
