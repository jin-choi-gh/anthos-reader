import { useMemo, type ReactNode } from "react"
import { today } from "../clock/clock"
import { Layout } from "./Layout"
import type { Material, Materials } from "../material/materials"
import { useNotebook } from "../notebook/useNotebook"
import { controlsOf } from "./frame/controls"
import { annotateFrame } from "./frame/frame"
import { PraxisBar } from "./praxisBar/PraxisBar"
import { useScene } from "./scenes/useScene"
import type { ReaderLayout } from "./usePlatform"
import { ViewerNotes, ViewerPage } from "./viewer/Viewer"

/** Annotate mode: the text's notebook, a frame on the reader's own notes and a new one, its scene,
 * and the praxis bar, all kept for as long as the mode lasts. It reads the notebook, and follows it
 * as it changes, but writes nothing. */
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
  // The scene sends nothing out yet: annotate mode writes nothing
  const scene = useScene(frame.subject, ignore)
  // The frame never moves, so its controls are none, and nothing is refused
  const controls = controlsOf(frame, ignore)
  const viewer = { projection: scene.viewer, materials, send: scene.toScene.viewer }

  return (
    <Layout
      layout={layout}
      topBar={topBar}
      page={<ViewerPage {...viewer} />}
      notes={<ViewerNotes {...viewer} />}
      notesAs="list"
      praxisBar={
        <PraxisBar
          controls={controls}
          projection={scene.praxisBar}
          send={scene.toScene.praxisBar}
          today={today()}
          label="Annotate"
        />
      }
    />
  )
}

function ignore() {}
