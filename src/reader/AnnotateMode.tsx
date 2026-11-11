import { useMemo, type ReactNode } from "react"
import { Layout } from "./Layout"
import type { Materials } from "./materials"
import { annotateFrame } from "./frame/frame"
import { useScene } from "./scenes/useScene"
import type { Note } from "./types"
import type { ReaderLayout } from "./usePlatform"
import { ViewerNotes, ViewerPage } from "./Viewer"

/** Annotate mode: a frame fixed on all the text's notes, and its scene, both kept for as long as the
 * mode lasts. The viewer draws from the scene and talks only to it. */
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
  const scene = useScene(frame.subject)
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
