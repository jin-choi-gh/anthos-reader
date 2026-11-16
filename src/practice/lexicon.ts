import { assertNever } from "../assertNever"
import type { Parts, Practice, Step } from "./types"

/** The parts a step is made of. */
export function partsOf(step: Step): Parts {
  switch (step.direction) {
    case "reflect": // reflect on an editor's prompt on the entire text
      return { prose: step.prose, highlight: [], writing: null, recall: null }
    case "consider": // read the editor's note on a passage
      return { prose: step.prose, highlight: [step.note], writing: null, recall: null }
    case "respond": // write about the whole poem
      return {
        prose: step.prose,
        highlight: [],
        writing: { target: "whole", tags: [], count: "one" },
        recall: null,
      }
    case "observe": // write about passages the reader chooses
      return {
        prose: step.prose,
        highlight: [],
        writing: { target: "chosen", tags: [], count: "one" },
        recall: null,
      }
    case "recall": // look back at what the reader wrote in the stage before
      return { prose: step.prose, highlight: [], writing: null, recall: { from: "previous" } }
    default:
      return assertNever(step)
  }
}

/** A stage's rest: nothing said, nothing asked. */
export const REST: Parts = { prose: [], highlight: [], writing: null, recall: null }

/** The final stage of a practice: word that it is done, and, when any of its steps asks for
 * writing, everything the reader wrote in it, brought back from every stage. A practice that asks
 * for nothing to be written has nothing to bring back, so its final stage recalls nothing. */
export function finalPartsOf(practice: Practice): Parts {
  const asks = practice.stages.some((stage) =>
    stage.steps.some((step) => partsOf(step).writing !== null),
  )
  return {
    prose: ["You have finished!"],
    highlight: [],
    writing: null,
    recall: asks ? { from: "all" } : null,
  }
}
