import { useMemo, type ReactNode } from "react"
import { assertNever } from "../assertNever"
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

/** Annotate mode: the text's notebook, a frame on the notes the reader wrote here and a new one, its
 * scene, and the praxis bar, all kept for as long as the mode lasts. It follows the notebook as it
 * changes, and writes the scene's effects in it: a new note with the poem's fingerprint and no
 * provenance, as it was written outside a practice, or a withdrawal. */
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
  const scene = useScene(frame.subject, (effect) => {
    switch (effect.kind) {
      case "note":
        return notebook.note({
          targets: effect.targets,
          tags: effect.tags,
          body: effect.body,
          fingerprint: material.fingerprint,
          from: null,
        })
      case "revise":
        return notebook.revise(effect.id, effect.body)
      case "withdraw":
        return notebook.withdraw(effect.id)
      default:
        return assertNever(effect)
    }
  })
  // How many notes the list holds, for the sheet's handle on a page
  const count = frame.subject.commentary.notes.length
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
      notesLabel={count === 0 ? "Notes" : `Notes · ${count}`}
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
