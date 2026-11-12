import { noteFor } from "../../practice/notes"
import type { Practice, Step } from "../../practice/types"
import { gateOf } from "../../runner/gate"
import { ruling } from "../../runner/step"
import type { Gate, Position } from "../../runner/types"
import type { Note } from "../../material/types"
import type { Subject } from "../scenes/types"
import type { Frame } from "./types"

/** The frame on a practice at a position: its heading, the runner's rulings on a step back and a
 * step on, and what it is fixed on: what the runner's gate holds, with its references resolved
 * against the text's notes. A step back and a step on are the frame's gait, which the runner never
 * sees. The practice and the position go no further than here. */
export function frameOf(practice: Practice, position: Position, notes: Note[]): Frame {
  const gate = gateOf(practice, position)
  return {
    heading: gate.kind === "final" ? practice.title : gate.stage.name,
    back: ruling(practice, position, position.step - 1),
    next: ruling(practice, position, position.step + 1),
    subject: subjectOf(gate, practice.text, notes),
  }
}

/** The frame in annotate mode: no practice and no runner, so no position and no rulings. It never
 * moves, and is fixed on all the notes. */
export function annotateFrame(text: string, notes: Note[]): Frame {
  return {
    heading: null,
    back: null,
    next: null,
    subject: { kind: "annotate", text, notes },
  }
}

function subjectOf(gate: Gate, text: string, notes: Note[]): Subject {
  switch (gate.kind) {
    case "final":
      return { kind: "final", text }
    case "rest":
      return { kind: "rest", text }
    case "step":
      return stepSubject(gate.step, text, notes)
  }
}

function stepSubject(step: Step, text: string, notes: Note[]): Subject {
  switch (step.direction) {
    case "consider":
      return { kind: "consider", text, note: noteFor(step.note, notes), prose: step.prose }
  }
}
