import { describe, expect, it } from "vitest"
import { isPractice, practiceProblem } from "../guard"
import { REST } from "../parts"
import type { Practice } from "../types"

const practice: Practice = {
  id: "test",
  title: "Test",
  text: "dickinson",
  stages: [
    {
      name: "One",
      steps: [
        {
          ...REST,
          prose: ["Look."],
          highlight: [{ id: "worm", notehead: "l3 Worm", tags: ["gloss"], body: "The worm." }],
        },
        { ...REST, writing: { target: "chosen", tags: [], count: "one" } },
      ],
    },
    { name: "Two", steps: [{ ...REST, recall: { from: "all" } }] },
  ],
}

/** The practice, as JSON would give it, with its first stage's first step changed. */
const withFirstStep = (step: Record<string, unknown>): unknown => {
  const copy = JSON.parse(JSON.stringify(practice))
  copy.stages[0].steps[0] = { ...copy.stages[0].steps[0], ...step }
  return copy
}

describe("isPractice and practiceProblem: a value read from a file or from storage", () => {
  it("takes a practice, as JSON gives it back", () => {
    const read: unknown = JSON.parse(JSON.stringify(practice))
    expect(practiceProblem(read)).toBeNull()
    expect(isPractice(read)).toBe(true)
  })

  it("refuses what is not an object, or lacks a field", () => {
    expect(practiceProblem(null)).toBe("the practice must be an object")
    expect(practiceProblem([])).toBe("the practice must be an object")
    const { stages: _stages, ...headless } = practice
    expect(practiceProblem(headless)).toBe("the practice has no stages")
    expect(isPractice(headless)).toBe(false)
  })

  it("refuses a field it does not know, which the fingerprint would hash unseen", () => {
    expect(practiceProblem({ ...practice, author: "Anon" })).toBe(
      "the practice has fields this reader does not know: author",
    )
    expect(practiceProblem(withFirstStep({ direction: "consider" }))).toBe(
      "stage 1, step 1 has fields this reader does not know: direction",
    )
  })

  it("asks for every part to be there, null where it is empty", () => {
    const { writing: _writing, ...partless } = practice.stages[0]!.steps[1]!
    const copy = JSON.parse(JSON.stringify(practice))
    copy.stages[0].steps[1] = partless
    expect(practiceProblem(copy)).toBe("stage 1, step 2 has no writing")
  })

  it("says where a wrong value is, and what it must be", () => {
    expect(practiceProblem(withFirstStep({ prose: "Look." }))).toBe(
      "stage 1, step 1: prose must be a list",
    )
    expect(practiceProblem(withFirstStep({ prose: ["Look.", 2] }))).toBe(
      "stage 1, step 1: prose paragraph 2 must be text",
    )
    expect(
      practiceProblem(withFirstStep({ writing: { target: "all", tags: [], count: "one" } })),
    ).toBe('stage 1, step 1: writing.target must be "whole" or "chosen"')
    expect(
      practiceProblem(withFirstStep({ writing: { target: "whole", tags: [], count: "two" } })),
    ).toBe('stage 1, step 1: writing.count must be "one"')
    expect(practiceProblem(withFirstStep({ recall: { from: "next" } }))).toBe(
      'stage 1, step 1: recall.from must be "previous" or "all"',
    )
    expect(
      practiceProblem(
        withFirstStep({ highlight: [{ id: "worm", notehead: 3, tags: [], body: "" }] }),
      ),
    ).toBe("stage 1, step 1, note 1: its notehead must be text")
    expect(
      practiceProblem(
        withFirstStep({ highlight: [{ id: "worm", notehead: "l3", tags: [1], body: "" }] }),
      ),
    ).toBe("stage 1, step 1, note 1: its tags, tag 1 must be text")
  })
})
