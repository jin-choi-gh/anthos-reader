import { spansOfNotehead } from "../material/noteheads"
import type { Annotation, Substrate } from "../material/types"
import type { EditorsNote } from "./types"

/** A step's editor's notes as annotations on the poem, each placed by its notehead, in the order
 * written. A note whose notehead cannot be placed on these lines is left out: problemsOf refuses a
 * practice with one, so a practice that runs has none. */
export function annotationsOf(substrate: Substrate, notes: readonly EditorsNote[]): Annotation[] {
  return notes.flatMap((note) => {
    const placed = spansOfNotehead(substrate, note.notehead)
    if ("problem" in placed) return []
    return [{ id: note.id, targets: placed.spans, tags: note.tags, body: note.body }]
  })
}
