import { assertNever } from "../../assertNever"
import type { Material } from "../../material/materials"
import { notesFor } from "../../material/notes"
import { sameSpan, spanProblem, wholePoem } from "../../material/spans"
import type { TextId } from "../../material/types"
import { notesFrom, notesOfStage } from "../../notebook/notebook"
import type { Provenance, ReaderNote } from "../../notebook/types"
import { annotationsOf } from "../../practice/editorsNotes"
import { fingerprintOfPractice } from "../../practice/fingerprint"
import { finalPartsOf, REST } from "../../practice/parts"
import { stageIndexOf, stepPlaceOf } from "../../practice/places"
import { gapsOf, slipsOf } from "../../practice/restore"
import type { Parts, Practice, Recall, Restore, Writing } from "../../practice/types"
import { finalOf, gateOf, restOf, standsAt } from "../../runner/gate"
import { ruling } from "../../runner/step"
import type { Standing } from "../../runner/types"
import type {
  Commentary,
  Gap,
  Recalled,
  RestoreSubject,
  Subject,
  WritingAbout,
} from "../scenes/types"
import type { Frame } from "./types"

/** The frame where the run stands: its heading, the rulings on a step back and a step on, and
 * its subject: the step's editor's notes, placed on the poem by their noteheads, as a set of their
 * own, in the step's order, to be disclosed, and disclosed already unless the reader is held at the
 * step; what the reader wrote there, found in the notebook; and the writing's target,
 * resolved against the poem. A note counts as written here only on this version of
 * the practice. A note on passages the reader chooses is found only if it was written on these
 * lines and every target keeps the rule for spans, so that its passages can be shown and chosen
 * again here. With a recall, the commentary is the notes it brings back, not the editor's: problemsOf
 * refuses a step with more than one part besides its prose. With a restore, the subject has its gaps
 * and slips, restored already unless the reader is held at the step. */
export function frameOf(
  practice: Practice,
  standing: Standing,
  material: Material,
  written: readonly ReaderNote[],
): Frame {
  const { station } = standing
  const gate = gateOf(practice, station)
  // The gait steps from where the reader stands: in the final stage, the last stage's rest
  const here = standsAt(practice, station)
  const parts =
    gate.kind === "step" ? gate.step : gate.kind === "rest" ? REST : finalPartsOf(practice)
  const { text } = practice
  const where: Provenance = {
    practice: practice.id,
    fingerprint: fingerprintOfPractice(practice),
    ...station,
  }
  return {
    heading: gate.kind === "final" ? practice.title : gate.stage.name,
    position:
      gate.kind === "step" ? { step: station.step + 1, of: restOf(practice, station.stage) } : null,
    back: ruling(practice, standing, here.step - 1),
    next: ruling(practice, standing, here.step + 1),
    subject: {
      key: `${practice.id}/${station.stage}/${station.step}`,
      text,
      prose: parts.prose,
      commentary:
        parts.recall === null
          ? editorsOf(parts.disclose, material, standing.heldAt !== station.step)
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
      restore:
        parts.restore === null
          ? null
          : restoreOf(parts.restore, material, standing.heldAt !== station.step),
      picking: null,
    },
  }
}

/** A restore's gaps, placed by their noteheads and in the poem's order, each with the text it takes
 * out (gapsOf); its slips, that same text, in alphabetical order (slipsOf); and whether it is
 * restored already. A gap that cannot be placed, which problemsOf refuses, is left out. */
function restoreOf(restore: Restore, material: Material, restored: boolean): RestoreSubject {
  const gaps: Gap[] = gapsOf(material.substrate, restore).map(({ span, text }) => ({ span, text }))
  return { of: restore.of, gaps, slips: slipsOf(gaps.map((gap) => gap.text)), restored }
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
    commentary: {
      set,
      notes: set.notes,
      shown: "listed",
      written: mine,
      recalled: null,
      disclosed: null,
    },
    writing: null,
    noting: { substrate: material.substrate, tags: [] },
    restore: null,
    picking: null,
  }
  return { heading: null, position: null, back: null, next: null, subject }
}

/** The notes a recall brings back: the reader's notes written in the stage it names, on the step it
 * names, or, for the whole practice, in every stage before this one, on this version of the
 * practice, that can be placed on the poem, and whose station is a step of this version, as it
 * always is unless the notebook was damaged. They come in the order
 * of the stages and steps they answered, then the order written, listed, each with the prose of the
 * step it answered and whether it is on the whole poem; the first of each stage carries the
 * stage's name, as a heading. No one may delete them. */
function recalledOf(
  recall: Recall,
  practice: Practice,
  where: Provenance,
  material: Material,
  written: readonly ReaderNote[],
): Commentary {
  const found = recalledNotes(recall, practice, where, written).flatMap((note) => {
    const prompt = promptOf(practice, note)
    return prompt !== null && placeable(note, material) ? [{ note, prompt }] : []
  })
  // Stable: notes on the same step keep the order written
  found.sort((a, b) => a.prompt.stage - b.prompt.stage || a.prompt.step - b.prompt.step)
  const notes = found.map(({ note }) => note)
  const set = notesFor(material.substrate, notes)
  const whole = wholePoem(material.substrate)
  const recalled: Recalled[] = found.map(({ note, prompt }, i) => ({
    prompt: prompt.prose,
    whole: note.targets.length === 1 && note.targets.every((target) => sameSpan(target, whole)),
    heading: found[i - 1]?.prompt.stage === prompt.stage ? null : prompt.stageName,
  }))
  return { set, notes: set.notes, shown: "listed", written: null, recalled, disclosed: null }
}

/** The reader's notes a recall names, on this version of the practice, before they are placed: those
 * written in the stage it names, or on the step it names, or in every stage before this one, in the
 * order of the stages, then the order written. A stage or step that is not there, which problemsOf
 * refuses, names none. */
function recalledNotes(
  recall: Recall,
  practice: Practice,
  where: Provenance,
  written: readonly ReaderNote[],
): ReaderNote[] {
  switch (recall.from) {
    case "stage": {
      const stage = stageIndexOf(practice, recall.id)
      return stage === null ? [] : notesOfStage(written, { ...where, stage })
    }
    case "step": {
      const place = stepPlaceOf(practice, recall.id)
      return place === null ? [] : notesFrom(written, { ...where, ...place })
    }
    case "all":
      return Array.from({ length: Math.max(where.stage, 0) }, (_, stage) =>
        notesOfStage(written, { ...where, stage }),
      ).flat()
    default:
      return assertNever(recall)
  }
}

/** The step a note answered, by its stage and its place in it, with that step's prose and its
 * stage's name, through the gate; null when its station is not a step of this version of the
 * practice. */
function promptOf(
  practice: Practice,
  note: ReaderNote,
): { stage: number; step: number; prose: readonly string[]; stageName: string } | null {
  const { from } = note
  if (from === null || from.stage < 0 || from.stage >= finalOf(practice)) return null
  if (from.step < 0 || from.step >= restOf(practice, from.stage)) return null
  const gate = gateOf(practice, { stage: from.stage, step: from.step })
  if (gate.kind !== "step") return null
  return {
    stage: from.stage,
    step: from.step,
    prose: gate.step.prose,
    stageName: gate.stage.name,
  }
}

/** Whether a reader's note can be placed on the poem: written on these lines, with every target
 * keeping the rule for spans. */
function placeable(note: ReaderNote, material: Material): boolean {
  return (
    note.fingerprint === material.fingerprint &&
    note.targets.every((target) => spanProblem(material.substrate, target) === null)
  )
}

/** The editor's notes a step discloses, as a set of their own, in the step's order, each placed on
 * the poem by its notehead, to be disclosed one by one; and whether they are disclosed already, as
 * they are once the reader is not held at the step (`free`), and always with none to disclose, as
 * at a step that asks something else, a rest or the final stage. */
function editorsOf(disclose: Parts["disclose"], material: Material, free: boolean): Commentary {
  const set = notesFor(material.substrate, annotationsOf(material.substrate, disclose))
  const disclosed = set.notes.length === 0 || free
  return { set, notes: set.notes, shown: "disclosed", written: null, recalled: null, disclosed }
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
