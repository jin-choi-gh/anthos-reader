import { assertNever } from "../assertNever"
import type { Parts, Step } from "./types"

/** The parts a step is made of. */
export function partsOf(step: Step): Parts {
  switch (step.direction) {
    case "consider": // read the editor's note on a passage
      return { prose: step.prose, highlight: [step.note], writing: null }
    case "respond": // write about the whole poem
      return { prose: step.prose, highlight: [], writing: { anchor: "whole", count: "one" } }
    default:
      return assertNever(step)
  }
}

/** A stage's rest: nothing said, nothing asked. */
export const REST: Parts = { prose: [], highlight: [], writing: null }

/** The final stage. */
export const FINAL: Parts = { prose: ["You have finished!"], highlight: [], writing: null }
