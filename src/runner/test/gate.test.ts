import { describe, expect, it } from "vitest"
import type { Practice } from "../../practice/types"
import { gateOf } from "../gate"

/** Two stages: a consider step and a respond step, then one consider step. The rests are at the
 * end of each stage, and the final stage is stage 2. */
const practice: Practice = {
  id: "test",
  title: "Test",
  text: "fixture",
  stages: [
    {
      name: "First",
      steps: [
        { direction: "consider", note: "@a", prose: ["On @a."] },
        { direction: "respond", prose: ["What does the bird eat?"] },
      ],
    },
    { name: "Second", steps: [{ direction: "consider", note: "@b", prose: ["On @b."] }] },
  ],
}
const first = practice.stages[0]!
const second = practice.stages[1]!

describe("gateOf", () => {
  it("holds the practice's step at a position, of whatever direction, with its stage", () => {
    expect(gateOf(practice, { stage: 0, step: 0 })).toEqual({
      kind: "step",
      stage: first,
      step: first.steps[0]!,
    })
    expect(gateOf(practice, { stage: 0, step: 1 })).toEqual({
      kind: "step",
      stage: first,
      step: first.steps[1]!,
    })
    expect(gateOf(practice, { stage: 1, step: 0 })).toEqual({
      kind: "step",
      stage: second,
      step: second.steps[0]!,
    })
  })

  it("holds the practice's own stage and step, not copies", () => {
    const gate = gateOf(practice, { stage: 0, step: 1 })
    expect(gate.kind === "step" && gate.stage).toBe(first)
    expect(gate.kind === "step" && gate.step).toBe(first.steps[1]!)
  })

  it("holds the rest one past a stage's last step", () => {
    expect(gateOf(practice, { stage: 0, step: 2 })).toEqual({ kind: "rest", stage: first })
    expect(gateOf(practice, { stage: 1, step: 1 })).toEqual({
      kind: "rest",
      stage: second,
    })
  })

  it("holds the final stage one past the last stage", () => {
    expect(gateOf(practice, { stage: 2, step: 0 })).toEqual({ kind: "final" })
  })

  it("holds the final stage at once for a practice with no stages", () => {
    const empty = { ...practice, stages: [] }
    expect(gateOf(empty, { stage: 0, step: 0 })).toEqual({ kind: "final" })
  })
})
