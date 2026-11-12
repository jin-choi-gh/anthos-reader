import type { Note, TextId } from "../../material/types"
import { notesFrom } from "../../notebook/notebook"
import type { ReaderNote } from "../../notebook/types"
import { FINAL, partsOf, REST } from "../../practice/lexicon"
import { noteFor } from "../../practice/references"
import type { Parts, Practice } from "../../practice/types"
import { gateOf } from "../../runner/gate"
import { ruling } from "../../runner/step"
import type { Standing } from "../../runner/types"
import type { Subject } from "../scenes/types"
import type { Frame } from "./types"

/** The frame on a practice where the screening stands: its heading, the runner's rulings on a step
 * back and a step on, and its subject: the parts of what the gate holds, with every reference
 * resolved, against the text's notes and the reader's notebook. A step back and a step on are the
 * frame's gait, which the runner never sees. The practice and the standing go no further than here. */
export function frameOf(
  practice: Practice,
  standing: Standing,
  notes: readonly Note[],
  written: readonly ReaderNote[],
): Frame {
  const { position } = standing
  const gate = gateOf(practice, position)
  const parts = gate.kind === "step" ? partsOf(gate.step) : gate.kind === "rest" ? REST : FINAL
  const { text } = practice
  return {
    heading: gate.kind === "final" ? practice.title : gate.stage.name,
    back: ruling(practice, standing, position.step - 1),
    next: ruling(practice, standing, position.step + 1),
    subject: {
      key: `${practice.id}/${position.stage}/${position.step}`,
      text,
      prose: parts.prose,
      commentary: { notes: resolved(parts, notes), shown: "marked" },
      writing:
        parts.writing === null
          ? null
          : {
              anchor: { kind: parts.writing.anchor, text },
              count: parts.writing.count,
              written: notesFrom(written, { practice: practice.id, ...position }),
            },
    },
  }
}

/** The frame at the viewing table (annotate mode): no practice and no runner, so no heading and no
 * rulings. It never moves, and lists all the editor's notes. */
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

/** The editor's notes a frame's iris picks out: each reference resolved, and any that name no note
 * in the text left out. */
function resolved(parts: Parts, notes: readonly Note[]): Note[] {
  return parts.highlight.flatMap((ref) => noteFor(ref, notes) ?? [])
}
