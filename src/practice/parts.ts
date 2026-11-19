import type { Parts, Practice } from "./types"

/** A stage's rest: nothing said, nothing asked. A step written with no parts would be one. */
export const REST: Parts = { prose: [], highlight: [], writing: null, recall: null }

/** The final stage of a practice: word that it is done, and, when any of its steps asks for
 * writing, everything the reader wrote in it, brought back from every stage. A practice that asks
 * for nothing to be written has nothing to bring back, so its final stage recalls nothing. */
export function finalPartsOf(practice: Practice): Parts {
  const asks = practice.stages.some((stage) => stage.steps.some((step) => step.writing !== null))
  return {
    prose: ["You have finished!"],
    highlight: [],
    writing: null,
    recall: asks ? { from: "all" } : null,
  }
}
