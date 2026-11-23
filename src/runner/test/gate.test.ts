import { describe, expect, it } from "vitest"
import { REST } from "../../practice/parts"
import { finalOf, gateOf } from "../gate"
import { practiceOf } from "../../practice/test/build"

/** Two stages: a step that says something and a step that asks for writing, then one that says
 * something. The rests are at the
 * end of each stage, and the final stage is stage 2. */
const practice = practiceOf({
  id: "test",
  title: "Test",
  text: "fixture",
  stages: [
    {
      name: "First",
      steps: [
        { ...REST, prose: ["On @a."] },
        {
          ...REST,
          prose: ["What does the bird eat?"],
          writing: { target: "whole", tags: [], count: "one" },
        },
      ],
    },
    { name: "Second", steps: [{ ...REST, prose: ["On @b."] }] },
  ],
})
const first = practice.stages[0]!
const second = practice.stages[1]!

describe("gateOf", () => {
  it("holds the practice's step at a station, whatever its parts, with its stage", () => {
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

describe("finalOf", () => {
  it("is one past the last stage, and the first stage for a practice with none", () => {
    expect(finalOf(practice)).toBe(2)
    expect(finalOf({ ...practice, stages: [] })).toBe(0)
  })
})
