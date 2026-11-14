import { assertNever } from "../../assertNever"
import type { Material } from "../../material/materials"
import { wholePoem } from "../../material/spans"
import type { Note, Span, TextId } from "../../material/types"
import { notesFrom } from "../../notebook/notebook"
import type { ReaderNote } from "../../notebook/types"
import { FINAL, partsOf, REST } from "../../practice/lexicon"
import { noteFor } from "../../practice/references"
import type { Parts, Practice, Writing } from "../../practice/types"
import { gateOf } from "../../runner/gate"
import { ruling } from "../../runner/step"
import type { Standing } from "../../runner/types"
import type { Subject } from "../scenes/types"
import type { Frame } from "./types"

/** The frame where the run stands: its heading, the rulings on a step back and a step on, and
 * its subject, with every reference resolved against the editor's notes and the reader's notebook,
 * and the writing's target against the poem. */
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
  return {
    heading: gate.kind === "final" ? practice.title : gate.stage.name,
    back: ruling(practice, standing, station.step - 1),
    next: ruling(practice, standing, station.step + 1),
    subject: {
      key: `${practice.id}/${station.stage}/${station.step}`,
      text,
      prose: parts.prose,
      commentary: { notes: resolved(parts, material.notes.notes), shown: "marked" },
      writing:
        parts.writing === null
          ? null
          : {
              targets: targetsOf(parts.writing, material),
              tags: parts.writing.tags,
              count: parts.writing.count,
              written: notesFrom(written, { practice: practice.id, ...station }),
            },
    },
  }
}

/** The frame in annotate mode: no practice and no runner, so no heading and no rulings. It never
 * moves, and lists all the editor's notes. */
export function annotateFrame(text: TextId, notes: readonly Note[]): Frame {
  const subject: Subject = {
    key: "annotate",
    text,
    prose: [],
    commentary: { notes, shown: "listed" },
    writing: null,
  }
  return { heading: null, back: null, next: null, subject }
}

/** The editor's notes a frame highlights: each reference resolved, and any that name no note
 * in the text left out. */
function resolved(parts: Parts, notes: readonly Note[]): Note[] {
  return parts.highlight.flatMap((ref) => noteFor(ref, notes) ?? [])
}

/** What the writing is about, in the poem: for "whole", the whole poem. */
function targetsOf(writing: Writing, material: Material): Span[] {
  switch (writing.target) {
    case "whole":
      return [wholePoem(material.substrate)]
    default:
      return assertNever(writing.target)
  }
}
