import { spansOfNotehead } from "../material/noteheads"
import type { Substrate } from "../material/types"
import type { Practice, Step } from "./types"

// A note's id, as loom allows one: letters, digits, - and _
const NOTE_ID = /^[A-Za-z0-9_-]+$/

/** Everything that keeps a practice from running on its text, whose lines are given, each saying
 * where it is: no stages; a stage with no steps; a step that says nothing and asks nothing; a note
 * id that is malformed, or repeated in the practice; a notehead that cannot be placed on the lines;
 * a step that both highlights and recalls, since a subject has one commentary; and a recall with
 * nothing it could bring back: in the first stage, with no stage before it, or when none of the
 * stages it recalls from (the stage before, or every stage before) asks for writing. None means the
 * practice can run. */
export function problemsOf(practice: Practice, substrate: Substrate): string[] {
  const problems: string[] = []
  const ids = new Map<string, string>()
  if (practice.stages.length === 0) problems.push("no stages")
  practice.stages.forEach((stage, s) => {
    const where = `stage ${s + 1} "${stage.name}"`
    if (stage.steps.length === 0) problems.push(`${where}: no steps`)
    stage.steps.forEach((step, i) => {
      const at = `${where}, step ${i + 1}`
      if (!says(step) && step.writing === null) {
        problems.push(`${at}: says nothing and asks nothing`)
      }
      for (const note of step.highlight) {
        if (!NOTE_ID.test(note.id)) {
          problems.push(
            `${at}: the note id ${JSON.stringify(note.id)} is not an id: use letters, digits, - and _`,
          )
        } else if (ids.has(note.id)) {
          problems.push(
            `${at}: the note id ${note.id} is already the id of a note in ${ids.get(note.id)}`,
          )
        } else {
          ids.set(note.id, at)
        }
        const placed = spansOfNotehead(substrate, note.notehead)
        if ("problem" in placed) problems.push(`${at}: the note ${note.id}: ${placed.problem}`)
      }
      if (step.recall !== null) {
        if (step.highlight.length > 0) {
          problems.push(`${at}: both highlights and recalls, but a step shows one set of notes`)
        }
        const from =
          step.recall.from === "previous"
            ? practice.stages.slice(s - 1, s)
            : practice.stages.slice(0, s)
        if (s === 0) {
          problems.push(`${at}: a recall in the first stage, with no stage before it`)
        } else if (
          from.every((earlier) => earlier.steps.every((before) => before.writing === null))
        ) {
          const which =
            step.recall.from === "previous"
              ? "the stage before asks for nothing"
              : "no stage before asks for anything"
          problems.push(`${at}: a recall, but ${which} to be written`)
        }
      }
    })
  })
  return problems
}

/** Whether a step says something: words with some text, notes to pick out, or notes to bring back. */
function says(step: Step): boolean {
  return (
    step.prose.some((paragraph) => paragraph.trim() !== "") ||
    step.highlight.length > 0 ||
    step.recall !== null
  )
}
