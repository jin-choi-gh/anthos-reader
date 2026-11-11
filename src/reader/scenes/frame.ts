import { ruling } from "../../practice/step"
import type { Position, Practice } from "../../practice/types"
import type { Frame } from "./types"

/** The frame on a practice: where it is, and the runner's rulings on a step back and a step on. */
export function frameOf(practice: Practice, position: Position): Frame {
  const final = position.stage === practice.stages.length
  return {
    position,
    heading: final ? practice.title : practice.stages[position.stage].name,
    back: ruling(practice, position, position.step - 1),
    next: ruling(practice, position, position.step + 1),
  }
}

/** The frame in annotate mode: one position, which it never leaves. */
export const annotateFrame: Frame = {
  position: { stage: 0, step: 0, opensOn: null },
  heading: null,
  back: null,
  next: null,
}
