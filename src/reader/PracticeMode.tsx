import { useMemo, type ReactNode } from "react"
import { assertNever } from "../assertNever"
import type { Practice } from "../practice/types"
import { useNotebook } from "../notebook/useNotebook"
import { useRun } from "../runner/useRun"
import { controlsOf } from "./frame/controls"
import { frameOf } from "./frame/frame"
import { Layout } from "./Layout"
import type { Materials } from "../material/materials"
import { PraxisBar } from "./praxisBar/PraxisBar"
import { useScene } from "./scenes/useScene"
import type { Note } from "../material/types"
import type { ReaderLayout } from "./usePlatform"
import { ViewerNotes, ViewerPage } from "./viewer/Viewer"
import { DevPanel } from "./dev/DevPanel"

/** Practice mode: the run of a practice, the frame on its current step, the frame's scene, and the
 * text's notebook, all kept for as long as the mode lasts. */
export function PracticeMode({
  practice,
  notes,
  materials,
  layout,
  topBar,
}: {
  practice: Practice
  notes: Note[]
  materials: Materials
  layout: ReaderLayout
  topBar: ReactNode
}) {
  const notebook = useNotebook(practice.text)
  const run = useRun(practice, notebook.notes)
  // A new frame only when the standing changes (a move, a new day, a note written): never on a
  // mere redraw
  const frame = useMemo(
    () => frameOf(practice, run.standing, notes, notebook.notes),
    [practice, run.standing, notes, notebook.notes],
  )
  const controls = controlsOf(frame, run.moveTo)
  // What the scene writes goes into the notebook, with where it was written
  const where = { practice: practice.id, ...run.standing.position }
  const scene = useScene(frame.subject, (effect) => {
    switch (effect.kind) {
      case "note":
        return notebook.note(effect.anchor, effect.body, where)
      case "revise":
        return notebook.revise(effect.id, effect.body)
      default:
        return assertNever(effect)
    }
  })
  const viewer = { projection: scene.viewer, materials, send: scene.toScene.viewer }

  return (
    <Layout
      layout={layout}
      topBar={topBar}
      dev={import.meta.env.DEV && <DevPanel practice={practice} run={run} notebook={notebook} />}
      page={<ViewerPage {...viewer} />}
      notes={scene.viewer.open === null ? null : <ViewerNotes {...viewer} />}
      praxisBar={
        <PraxisBar
          controls={controls}
          projection={scene.praxisBar}
          send={scene.toScene.praxisBar}
          today={run.today}
        />
      }
    />
  )
}
