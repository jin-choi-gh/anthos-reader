import type { Practice } from "../practice/types"
import type { Gate, Position } from "./types"

/** What is in the gate at a position: the practice's step there, or the rest, or the final stage. */
export function gateOf(practice: Practice, position: Position): Gate {
  if (position.stage === practice.stages.length) return { kind: "final" }
  const stage = practice.stages[position.stage]
  if (position.step === stage.steps.length) return { kind: "rest", stage }
  return { kind: "step", stage, step: stage.steps[position.step] }
}
