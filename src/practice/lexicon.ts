import { assertNever } from "../assertNever"
import type { Parts, Step } from "./types"

// The lexicon: the reel's grammar. It is the one place that reads a step's direction; past it, a
// frame of the reel is only its parts. A new direction made of parts that already exist is one more
// case here, and nothing else.

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

/** The intermission card, spliced in at the end of each stage: the poem, and nothing asked. The
 * praxis bar's buttons say when the next stage opens. */
export const REST: Parts = { prose: [], highlight: [], writing: null }

/** The end card, spliced in after the last stage. */
export const FINAL: Parts = { prose: ["You have finished!"], highlight: [], writing: null }
