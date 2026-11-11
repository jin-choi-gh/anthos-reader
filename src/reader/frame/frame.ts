import { noteFor } from "../../practice/notes"
import { ruling } from "../../practice/step"
import type { Position, Practice } from "../../practice/types"
import type { Note } from "../types"
import type { Subject } from "../scenes/types"
import type { Frame } from "./types"

/** The frame on a practice: where it is, the runner's rulings on a step back and a step on, and
 * what it is fixed on, with the step's references resolved against the text's notes. */
export function frameOf(practice: Practice, position: Position, notes: Note[]): Frame {
  const final = position.stage === practice.stages.length
  return {
    position,
    heading: final ? practice.title : practice.stages[position.stage].name,
    back: ruling(practice, position, position.step - 1),
    next: ruling(practice, position, position.step + 1),
    subject: subjectOf(practice, position, notes),
  }
}

/** The frame in annotate mode: one position, which it never leaves, fixed on all the notes. */
export function annotateFrame(text: string, notes: Note[]): Frame {
  return {
    position: { stage: 0, step: 0, opensOn: null },
    heading: null,
    back: null,
    next: null,
    subject: { kind: "annotate", text, notes },
  }
}

function subjectOf(practice: Practice, position: Position, notes: Note[]): Subject {
  const { text } = practice
  if (position.stage === practice.stages.length) return { kind: "final", text }
  const steps = practice.stages[position.stage].steps
  if (position.step === steps.length) return { kind: "rest", text }
  const step = steps[position.step]
  switch (step.verb) {
    case "consider":
      return { kind: "consider", text, note: noteFor(step.note, notes), prose: step.prose }
  }
}
