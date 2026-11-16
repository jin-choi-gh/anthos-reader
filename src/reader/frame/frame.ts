import { assertNever } from "../../assertNever"
import type { Material } from "../../material/materials"
import { notesFor } from "../../material/notes"
import { sameSpan, spanProblem, wholePoem } from "../../material/spans"
import type { Note, TextId } from "../../material/types"
import { notesFrom, notesOfStage } from "../../notebook/notebook"
import type { Provenance, ReaderNote } from "../../notebook/types"
import { fingerprintOfPractice } from "../../practice/fingerprint"
import { FINAL, partsOf, REST } from "../../practice/lexicon"
import { noteFor } from "../../practice/references"
import type { Parts, Practice, Recall, Writing } from "../../practice/types"
import { finalOf, gateOf, restOf } from "../../runner/gate"
import { ruling } from "../../runner/step"
import type { Standing } from "../../runner/types"
import type { Commentary, Recalled, Subject, WritingAbout } from "../scenes/types"
import type { Frame } from "./types"

/** The frame where the run stands: its heading, the rulings on a step back and a step on, and
 * its subject, with every reference resolved against the editor's notes and the reader's notebook,
 * and the writing's target against the poem. A note counts as written here only on this version of
 * the practice. A note on passages the reader chooses is found only if it was written on these
 * lines and every target keeps the rule for spans, so that its passages can be shown and chosen
 * again here. With a recall, the commentary is the notes it brings back, not the editor's: no
 * direction both highlights and recalls. */
export function frameOf(
  practice: Practice,
  standing: Standing,
  material: Material,
  written: readonly ReaderNote[],
): Frame {
  const { station } = standing
  const gate = gateOf(practice, station)
  const parts = gate.kind === "step" ? partsOf(gate.step) : gate.kind === "rest" ? REST : FINAL
  const { text } = practice
  const where: Provenance = {
    practice: practice.id,
    fingerprint: fingerprintOfPractice(practice),
    ...station,
  }
  return {
    heading: gate.kind === "final" ? practice.title : gate.stage.name,
    back: ruling(practice, standing, station.step - 1),
    next: ruling(practice, standing, station.step + 1),
    subject: {
      key: `${practice.id}/${station.stage}/${station.step}`,
      text,
      prose: parts.prose,
      commentary:
        parts.recall === null
          ? {
              set: material.notes,
              notes: resolved(parts, material.notes.notes),
              shown: "marked",
              written: null,
              recalled: null,
            }
          : recalledOf(parts.recall, practice, where, material, written),
      writing:
        parts.writing === null
          ? null
          : {
              about: aboutOf(parts.writing, material),
              tags: parts.writing.tags,
              count: parts.writing.count,
              written: writtenOn(parts.writing, material, notesFrom(written, where)),
            },
      noting: null,
    },
  }
}

/** The frame in annotate mode: no practice and no runner, so no heading and no rulings. It never
 * moves. It lists the notes the reader wrote in annotate mode, those with no provenance, that can
 * be placed on the poem, in the order written, and carries them, so that one can be deleted; and it
 * has noting, with no tags, for a new note on passages of the poem the reader chooses. */
export function annotateFrame(
  text: TextId,
  material: Material,
  written: readonly ReaderNote[],
): Frame {
  const mine = written.filter((note) => note.from === null && placeable(note, material))
  const set = notesFor(material.substrate, mine)
  const subject: Subject = {
    key: "annotate",
    text,
    prose: [],
    commentary: { set, notes: set.notes, shown: "listed", written: mine, recalled: null },
    writing: null,
    noting: { substrate: material.substrate, tags: [] },
  }
  return { heading: null, back: null, next: null, subject }
}

/** The notes a recall brings back: the reader's notes written in the stage before, on this version
 * of the practice, that can be placed on the poem, and whose station is a step of this version, as
 * it always is unless the notebook was damaged. They come in the order of the steps they answered,
 * then the order written, listed, each with the prose of the step it answered and whether it is on
 * the whole poem; no one may delete them. */
function recalledOf(
  recall: Recall,
  practice: Practice,
  where: Provenance,
  material: Material,
  written: readonly ReaderNote[],
): Commentary {
  const stage = stageOf(recall, where.stage)
  const found = notesOfStage(written, { ...where, stage }).flatMap((note) => {
    const prompt = promptOf(practice, note)
    return prompt !== null && placeable(note, material) ? [{ note, prompt }] : []
  })
  found.sort((a, b) => a.prompt.step - b.prompt.step)
  const notes = found.map(({ note }) => note)
  const set = notesFor(material.substrate, notes)
  const whole = wholePoem(material.substrate)
  const recalled: Recalled[] = found.map(({ note, prompt }) => ({
    prompt: prompt.prose,
    whole: note.targets.length === 1 && note.targets.every((target) => sameSpan(target, whole)),
  }))
  return { set, notes: set.notes, shown: "listed", written: null, recalled }
}

/** The stage a recall brings notes back from: the stage before this one. */
function stageOf(recall: Recall, stage: number): number {
  switch (recall.from) {
    case "previous":
      return stage - 1
    default:
      return assertNever(recall.from)
  }
}

/** The step a note answered, by its place in its stage, and that step's prose, through the gate;
 * null when its station is not a step of this version of the practice. */
function promptOf(
  practice: Practice,
  note: ReaderNote,
): { step: number; prose: readonly string[] } | null {
  const { from } = note
  if (from === null || from.stage < 0 || from.stage >= finalOf(practice)) return null
  if (from.step < 0 || from.step >= restOf(practice, from.stage)) return null
  const gate = gateOf(practice, { stage: from.stage, step: from.step })
  return gate.kind === "step" ? { step: from.step, prose: partsOf(gate.step).prose } : null
}

/** Whether a reader's note can be placed on the poem: written on these lines, with every target
 * keeping the rule for spans. */
function placeable(note: ReaderNote, material: Material): boolean {
  return (
    note.fingerprint === material.fingerprint &&
    note.targets.every((target) => spanProblem(material.substrate, target) === null)
  )
}

/** The editor's notes a frame highlights: each reference resolved, and any that name no note
 * in the text left out. */
function resolved(parts: Parts, notes: readonly Note[]): Note[] {
  return parts.highlight.flatMap((ref) => noteFor(ref, notes) ?? [])
}

/** What the writing is about, in the poem: for "whole", the whole poem; for "chosen", passages the
 * reader chooses from the poem's lines. */
function aboutOf(writing: Writing, material: Material): WritingAbout {
  switch (writing.target) {
    case "whole":
      return { kind: "fixed", targets: [wholePoem(material.substrate)] }
    case "chosen":
      return { kind: "chosen", substrate: material.substrate }
    default:
      return assertNever(writing.target)
  }
}

/** The notes the writing finds written on its step: all of them for a note on the whole poem; for a
 * note on passages the reader chooses, only those that can be placed on the poem. */
function writtenOn(
  writing: Writing,
  material: Material,
  notes: readonly ReaderNote[],
): readonly ReaderNote[] {
  switch (writing.target) {
    case "whole":
      return notes
    case "chosen":
      return notes.filter((note) => placeable(note, material))
    default:
      return assertNever(writing.target)
  }
}
