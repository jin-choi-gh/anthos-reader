import type { Material } from "../material/materials"
import { noteheadOf } from "../material/noteheads"
import { notesFor } from "../material/notes"
import { comparePositions, lineLength, sameSpan } from "../material/spans"
import type { Span, Substrate } from "../material/types"
import { annotationsOf } from "../practice/editorsNotes"
import { stepPlaceOf } from "../practice/places"
import type { StepPlace } from "../practice/places"
import { gapsOf } from "../practice/restore"
import type { EditorsNote, Practice, Restore, StepId } from "../practice/types"
import type { Effect, PickingSubject, Subject } from "../reader/scenes/types"
import { nextNoteId, type Edit } from "./edits"

/** The subject of the step being made, named by its id, for the Scene to play as annotate mode's
 * is played: the step's prose, as the reader will see it; its editor's notes, placed by their
 * noteheads as a set of their own, each picked out; nothing for the editor to write as a reader;
 * and, when `noting` says the step highlights, a noting, with no tags, for a new editor's note on
 * passages chosen in the poem; and, when the step restores, a picking, of the poem's words or of its
 * lines, as the restore takes out (pickingOf). The note `inHand`, when given, taken up in the noting to be written
 * again, is left out of the notes picked out, so that it is not drawn twice. Its key is the step's
 * id, so another step starts the scene afresh, and the same step keeps it as its notes change, or as
 * it moves; without a noting, the scene lets go of any note being written, and of choosing. With no
 * step, or none with that id, it is the poem alone. */
export function makerFrame(
  draft: Practice,
  id: StepId | null,
  material: Material,
  { noting, inHand = null }: { noting: boolean; inHand?: string | null },
): Subject {
  const place = id === null ? null : stepPlaceOf(draft, id)
  const step = place === null ? undefined : draft.stages[place.stage]?.steps[place.step]
  const highlight = (step?.highlight ?? []).filter((note) => note.id !== inHand)
  const set = notesFor(material.substrate, annotationsOf(material.substrate, highlight))
  return {
    key: step === undefined ? "form" : `form/${step.id}`,
    text: draft.text,
    prose: step?.prose ?? [],
    commentary: { set, notes: set.notes, shown: "marked", written: null, recalled: null },
    writing: null,
    noting: step !== undefined && noting ? { substrate: material.substrate, tags: [] } : null,
    restore: null,
    picking: step?.restore ? pickingOf(step.restore, material) : null,
  }
}

/** The picking for a restore: each of the poem's words, or each of its lines with text, as the
 * restore takes out, in the poem's order, with whether a gap of the restore is placed on it. */
export function pickingOf(restore: Restore, material: Material): PickingSubject {
  const { substrate } = material
  const units = restore.of === "words" ? material.words : linesOf(substrate)
  const gaps = gapsOf(substrate, restore)
  return {
    of: restore.of,
    units: units.map((span) => ({ span, taken: gaps.some((gap) => sameSpan(gap.span, span)) })),
  }
}

/** Each line with text, whole. */
function linesOf(substrate: Substrate): Span[] {
  return substrate.lines.flatMap((line, i) =>
    line.text === ""
      ? []
      : [{ start: { line: i, offset: 0 }, end: { line: i, offset: lineLength(substrate, i) } }],
  )
}

/** The edit a word or line picked in the poem makes to the step at a place, which restores: when a
 * gap of the step is placed on that very span, one that takes the gap away; otherwise one that adds
 * a gap there, its notehead written by noteheadOf, before the first gap placed after it, so that a
 * restore made here keeps its gaps in the poem's order. Null when the step is not there or does not
 * restore, or the span cannot be written as a notehead, which a word or line of the poem always
 * can. */
export function editOfPick(
  draft: Practice,
  at: StepPlace,
  span: Span,
  substrate: Substrate,
): Edit | null {
  const restore = draft.stages[at.stage]?.steps[at.step]?.restore ?? null
  if (restore === null) return null
  const gaps = gapsOf(substrate, restore)
  const there = gaps.find((gap) => sameSpan(gap.span, span))
  if (there !== undefined) return { kind: "removeGap", at, index: there.index }
  const gap = noteheadOf(substrate, [span])
  if (gap === null) return null
  const after = gaps.find((other) => comparePositions(other.span.start, span.start) > 0)
  return { kind: "addGap", at, gap, index: after?.index ?? restore.gaps.length }
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

/** The edit a note sent out by the noting makes to the step at a place: with the note `inHand`
 * (its id) taken up from that step, a change to it, on its passages and with its words as they are
 * now, keeping its id, its tags and its place; otherwise a new editor's note at the end of the
 * step's notes, with the first id the draft does not use. Null when the step is not there, or the
 * targets cannot be written as a notehead, which a passage chosen in the viewer never is. */
export function editOfNote(
  draft: Practice,
  at: StepPlace,
  inHand: string | null,
  effect: Extract<Effect, { kind: "note" }>,
  substrate: Substrate,
): Edit | null {
  const step = draft.stages[at.stage]?.steps[at.step]
  if (step === undefined) return null
  const index = inHand === null ? -1 : step.highlight.findIndex((note) => note.id === inHand)
  const old = step.highlight[index]
  if (old !== undefined) {
    const note = noteOf(effect, substrate, old.id)
    if (note === null) return null
    return {
      kind: "changeNote",
      at,
      index,
      note: { ...old, notehead: note.notehead, body: note.body },
    }
  }
  const note = noteOf(effect, substrate, nextNoteId(draft))
  return note === null ? null : { kind: "addNote", at, note }
}
