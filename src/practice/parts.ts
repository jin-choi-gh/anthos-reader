import type { Parts, Practice } from "./types"

/** A stage's rest: nothing said, nothing asked. It has no id: only the runner adds it. */
export const REST: Parts = {
  prose: [],
  highlight: [],
  writing: null,
  recall: null,
  restore: null,
}

/** The final stage of a practice, which has no id: word that it is done, and, when any of its steps
 * asks for writing, everything the reader wrote in it, brought back from every stage, the only
 * recall of the whole practice. A practice that asks
 * for nothing to be written has nothing to bring back, so its final stage recalls nothing. */
export function finalPartsOf(practice: Practice): Parts {
  const asks = practice.stages.some((stage) => stage.steps.some((step) => step.writing !== null))
  return {
    prose: ["Explicit."],
    highlight: [],
    writing: null,
    recall: asks ? { from: "all" } : null,
    restore: null,
  }
}
