import { useMemo, type ReactNode } from "react"
import type { PageOrSpread } from "../components/usePlatform"
import { assertNever } from "../assertNever"
import { fingerprintOfPractice } from "../practice/fingerprint"
import type { Practice } from "../practice/types"
import { useNotebook } from "../notebook/useNotebook"
import { finalOf } from "../runner/gate"
import { useRun } from "../runner/useRun"
import { controlsOf } from "./frame/controls"
import { frameOf } from "./frame/frame"
import { Layout } from "./Layout"
import type { Material, Materials } from "../material/materials"
import { PraxisBar } from "./praxisBar/PraxisBar"
import { useScene } from "./scenes/useScene"
import { ViewerNotes, ViewerPage } from "./viewer/Viewer"
import { DevPanel } from "./dev/DevPanel"

/** Practice mode: the run of a practice, the frame on its current step, the frame's scene, and the
 * text's notebook, all kept for as long as the mode lasts, which is as long as the practice's
 * version: the Reader keys the mode by it. Notes the step lists, as a recall's are, are always
 * shown, in the sheet open on a page; otherwise only the note the reader opened. */
export function PracticeMode({
  practice,
  material,
  materials,
  layout,
  topBar,
}: {
  practice: Practice
  material: Material
  materials: Materials
  layout: PageOrSpread
  topBar: ReactNode
}) {
  const notebook = useNotebook(practice.text)
  const run = useRun(practice, notebook.notes)
  // A new frame only when the standing changes (a move, a new day, a note written): never on a
  // mere redraw
  const frame = useMemo(
    () => frameOf(practice, run.standing, material, notebook.notes),
    [practice, run.standing, material, notebook.notes],
  )
  const controls = controlsOf(frame, run.moveTo)
  // What the scene writes goes into the notebook, with where it was written, in which version
  const fingerprint = useMemo(() => fingerprintOfPractice(practice), [practice])
  const where = { practice: practice.id, fingerprint, ...run.standing.station }
  const scene = useScene(frame.subject, (effect) => {
    switch (effect.kind) {
      case "note":
        return notebook.note({
          targets: effect.targets,
          tags: effect.tags,
          body: effect.body,
          fingerprint: material.fingerprint,
          from: where,
        })
      case "revise":
        return notebook.revise(effect.id, effect.targets, effect.body)
      case "withdraw":
        return notebook.withdraw(effect.id)
      default:
        return assertNever(effect)
    }
  })
  const viewer = { projection: scene.viewer, materials, send: scene.toScene.viewer }
  const listed = scene.viewer.kind === "listed"
  const count = scene.viewer.kind === "listed" ? scene.viewer.shown.length : 0
  // The final stage brings back the reader's responses to the whole practice; a recall step, to
  // the stage or step it names
  const label =
    run.standing.station.stage === finalOf(practice) ? "Your responses" : "Responses to Recall"

  return (
    <Layout
      layout={layout}
      topBar={topBar}
      dev={import.meta.env.DEV && <DevPanel practice={practice} run={run} notes={notebook.notes} />}
      page={<ViewerPage {...viewer} />}
      notes={listed || scene.viewer.open !== null ? <ViewerNotes {...viewer} /> : null}
      notesAs={listed ? "list" : "open"}
      notesLabel={count === 0 ? label : `${label} · ${count}`}
      notesOpen={listed}
      praxisBar={
        <PraxisBar
          controls={controls}
          projection={scene.praxisBar}
          send={scene.toScene.praxisBar}
          today={run.today}
          label="Practice"
        />
      }
    />
  )
}
