import type { Material } from "../material/materials"
import { noteheadOf } from "../material/noteheads"
import { notesFor } from "../material/notes"
import type { Substrate } from "../material/types"
import { annotationsOf } from "../practice/editorsNotes"
import type { EditorsNote, Practice } from "../practice/types"
import type { Effect, Subject } from "../reader/scenes/types"

/** The subject of the step being made, for the Scene to play as annotate mode's is played: the
 * step's prose, as the reader will see it; its editor's notes, placed by their noteheads as a set of
 * their own, each picked out; nothing for the editor to write as a reader; and a noting, with no
 * tags, for a new editor's note on passages chosen in the poem. Its key is the step's place, so
 * another step starts the scene afresh, and the same step keeps it as its notes change. Null when
 * the draft has no step there. */
export function makerFrame(
  draft: Practice,
  at: { readonly stage: number; readonly step: number },
  material: Material,
): Subject | null {
  const step = draft.stages[at.stage]?.steps[at.step]
  if (step === undefined) return null
  const set = notesFor(material.substrate, annotationsOf(material.substrate, step.highlight))
  return {
    key: `form/${at.stage}/${at.step}`,
    text: draft.text,
    prose: step.prose,
    commentary: { set, notes: set.notes, shown: "marked", written: null, recalled: null },
    writing: null,
    noting: { substrate: material.substrate, tags: [] },
  }
}

/** The editor's note a noting sends out, with the id given: its chosen targets written as a
 * notehead, its tags and its body. Null when the targets cannot be written as one, which a passage
 * chosen in the viewer never is. */
export function noteOf(
  effect: Extract<Effect, { kind: "note" }>,
  substrate: Substrate,
  id: string,
): EditorsNote | null {
  const notehead = noteheadOf(substrate, effect.targets)
  if (notehead === null) return null
  return { id, notehead, tags: effect.tags, body: effect.body }
}
