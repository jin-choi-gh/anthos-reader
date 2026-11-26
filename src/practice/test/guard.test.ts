import { describe, expect, it } from "vitest"
import { isPractice, practiceProblem } from "../guard"
import { REST } from "../parts"
import { practiceOf } from "./build"

const practice = practiceOf({
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
    {
      name: "Two",
      steps: [{ ...REST, prose: ["Again."], recall: { from: "step", id: "step-2" } }],
    },
  ],
})

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
    expect(practiceProblem(withFirstStep({ recall: { from: "previous" } }))).toBe(
      'stage 1, step 1: recall.from must be "stage" or "step" or "all"',
    )
    expect(practiceProblem(withFirstStep({ id: 4 }))).toBe("stage 1, step 1: its id must be text")
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

  it("asks a stage for its id, its name, its days and its steps, and its days to be a number or null", () => {
    const copy = JSON.parse(JSON.stringify(practice))
    delete copy.stages[1].days
    expect(practiceProblem(copy)).toBe("stage 2 has no days")
    copy.stages[1].days = "1"
    expect(practiceProblem(copy)).toBe("stage 2: its days must be a number, or null")
    copy.stages[1].days = 2.5
    expect(practiceProblem(copy)).toBeNull()
    copy.stages[0].id = null
    expect(practiceProblem(copy)).toBe("stage 1: its id must be text")
  })

  it("asks a restore for whether it takes out words or lines, and for its gaps as text", () => {
    expect(
      practiceProblem(withFirstStep({ restore: { of: "words", gaps: ["l3 Angle"] } })),
    ).toBeNull()
    expect(practiceProblem(withFirstStep({ restore: { of: "lines", gaps: [] } }))).toBeNull()
    expect(practiceProblem(withFirstStep({ restore: { of: "stanzas", gaps: [] } }))).toBe(
      'stage 1, step 1: restore.of must be "words" or "lines"',
    )
    expect(practiceProblem(withFirstStep({ restore: { of: "words", gaps: "l3" } }))).toBe(
      "stage 1, step 1: restore.gaps must be a list",
    )
    expect(practiceProblem(withFirstStep({ restore: { of: "words", gaps: ["l3", 4] } }))).toBe(
      "stage 1, step 1: restore, gap 2 must be text",
    )
    expect(practiceProblem(withFirstStep({ restore: { gaps: [] } }))).toBe(
      "stage 1, step 1: restore has no of",
    )
    expect(practiceProblem(withFirstStep({ restore: { of: "words", gaps: [], decoys: [] } }))).toBe(
      "stage 1, step 1: restore has fields this reader does not know: decoys",
    )
  })

  it("asks a step for its restore, null where it has none, as an older practice has none", () => {
    const { restore: _restore, ...older } = practice.stages[0]!.steps[0]!
    const copy = JSON.parse(JSON.stringify(practice))
    copy.stages[0].steps[0] = older
    expect(practiceProblem(copy)).toBe("stage 1, step 1 has no restore")
  })

  it("asks a recall of a stage or step for an id, and one of the whole practice for none", () => {
    expect(practiceProblem(withFirstStep({ recall: { from: "stage", id: "stage-2" } }))).toBeNull()
    expect(practiceProblem(withFirstStep({ recall: { from: "all" } }))).toBeNull()
    expect(practiceProblem(withFirstStep({ recall: { from: "step" } }))).toBe(
      "stage 1, step 1: recall has no id",
    )
    expect(practiceProblem(withFirstStep({ recall: { from: "step", id: 2 } }))).toBe(
      "stage 1, step 1: recall.id must be text",
    )
    expect(practiceProblem(withFirstStep({ recall: { from: "all", id: "stage-1" } }))).toBe(
      "stage 1, step 1: recall has fields this reader does not know: id",
    )
  })
})
