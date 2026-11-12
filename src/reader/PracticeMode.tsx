import { useMemo, type ReactNode } from "react"
import type { Practice } from "../practice/types"
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

/** Practice mode: the run of a practice, the frame on its current step, and the frame's scene, all
 * kept for as long as the mode lasts. The frame's side and the scene's side meet only here, and go
 * out apart: the frame's controls to the praxis bar, the scene's projections to the viewer and the
 * praxis bar. */
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
  const run = useRun(practice)
  // A new frame only when the run moves, or a new day opens a stage: never on a mere redraw
  const frame = useMemo(
    () => frameOf(practice, run.position, notes),
    [practice, run.position, notes],
  )
  const controls = controlsOf(frame, run.moveTo)
  const scene = useScene(frame.subject)
  const viewer = { projection: scene.viewer, materials, send: scene.toScene.viewer }

  return (
    <Layout
      layout={layout}
      topBar={topBar}
      dev={import.meta.env.DEV && <DevPanel practice={practice} run={run} />}
      page={<ViewerPage {...viewer} />}
      notes={scene.viewer.open === null ? null : <ViewerNotes {...viewer} />}
      praxisBar={<PraxisBar controls={controls} projection={scene.praxisBar} today={run.today} />}
    />
  )
}
