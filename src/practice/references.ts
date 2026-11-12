import type { Note } from "../material/types"
import { partsOf } from "./lexicon"
import type { Practice } from "./types"

// The reel's citations of the print: a reference such as "@angle-worm" names one of the editor's
// notes by its loom id. Here they are read, resolved, and checked before a practice is screened.

const REFERENCE = /^@([A-Za-z0-9_-]+)$/

/** The loom id a reference names, or null when it is not a reference to a note in this text. */
export function idOf(ref: string): string | null {
  return REFERENCE.exec(ref)?.[1] ?? null
}

/** The editor's note a reference names, or null when the text has none by that id. */
export function noteFor(ref: string, notes: readonly Note[]): Note | null {
  const id = idOf(ref)
  return id === null ? null : (notes.find((note) => note.loomId === id) ?? null)
}

/** Everything that keeps a practice from being screened on a text: a missing stage or step, or a
 * reference that is malformed or names no note in the text. */
export function problemsOf(practice: Practice, notes: readonly Note[]): string[] {
  const problems: string[] = []
  if (practice.stages.length === 0) problems.push("no stages")
  practice.stages.forEach((stage, s) => {
    const where = `stage ${s + 1} "${stage.name}"`
    if (stage.steps.length === 0) problems.push(`${where}: no steps`)
    stage.steps.forEach((step, i) => {
      const at = `${where}, step ${i + 1}`
      for (const ref of partsOf(step).highlight) {
        if (idOf(ref) === null) {
          problems.push(
            ref.includes("/")
              ? `${at}: ${ref} refers to another text, which is not read yet`
              : `${at}: ${ref} is not a note reference; write @ and the note's id`,
          )
        } else if (noteFor(ref, notes) === null) {
          problems.push(`${at}: no note ${ref} in ${practice.text}`)
        }
      }
    })
  })
  return problems
}
