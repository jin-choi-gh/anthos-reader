import { describe, expect, it } from "vitest"
import { fingerprintOfPractice } from "../fingerprint"
import type { Practice, Step } from "../types"

const consider: Step = { direction: "consider", note: "@angle-worm", prose: ["Look."] }
const respond: Step = { direction: "respond", prose: ["What does the bird eat?"] }

const practice: Practice = {
  id: "test",
  title: "Test",
  text: "dickinson",
  stages: [
    { name: "First", steps: [consider, respond] },
    { name: "Second", steps: [{ direction: "recall", prose: [] }] },
  ],
}

/** The practice with its first stage's steps replaced. */
const withSteps = (...steps: Step[]): Practice => ({
  ...practice,
  stages: [{ name: "First", steps }, ...practice.stages.slice(1)],
})

describe("fingerprintOfPractice: the practice's version", () => {
  it("is the same for the same steps, as 14 hex digits", () => {
    const copy: Practice = JSON.parse(JSON.stringify(practice))
    expect(fingerprintOfPractice(copy)).toBe(fingerprintOfPractice(practice))
    expect(fingerprintOfPractice(practice)).toMatch(/^[0-9a-f]{14}$/)
  })

  it("does not change with the order the source writes a step's keys in", () => {
    const reordered: Step = { prose: ["Look."], note: "@angle-worm", direction: "consider" }
    expect(fingerprintOfPractice(withSteps(reordered, respond))).toBe(
      fingerprintOfPractice(practice),
    )
  })

  it("changes with any change to a step: its prose, its note, its direction, or the steps' order", () => {
    const base = fingerprintOfPractice(practice)
    const changed = [
      withSteps({ ...consider, prose: ["Look again."] }, respond),
      withSteps({ ...consider, prose: [""] }, respond),
      withSteps({ ...consider, note: "@beads" }, respond),
      withSteps(consider, { direction: "observe", prose: respond.prose }),
      withSteps(respond, consider),
      withSteps(consider),
    ]
    for (const edited of changed) expect(fingerprintOfPractice(edited)).not.toBe(base)
    expect(fingerprintOfPractice(withSteps({ ...consider, prose: [] }, respond))).not.toBe(
      fingerprintOfPractice(withSteps({ ...consider, prose: [""] }, respond)),
    )
  })

  it("does not change with the practice's title or its stages' names, which are headings", () => {
    const renamed: Practice = {
      ...practice,
      title: "Renamed",
      stages: practice.stages.map((stage) => ({ ...stage, name: `${stage.name}, renamed` })),
    }
    expect(fingerprintOfPractice(renamed)).toBe(fingerprintOfPractice(practice))
  })

  it("tells two stages from one, even with the same steps in order", () => {
    const merged: Practice = {
      ...practice,
      stages: [{ name: "All", steps: practice.stages.flatMap((stage) => stage.steps) }],
    }
    expect(fingerprintOfPractice(merged)).not.toBe(fingerprintOfPractice(practice))
  })
})

describe("fingerprintOfPractice: a reflect step", () => {
  const reflect: Step = { direction: "reflect", prose: ["Read the poem through."] }

  it("is part of the version: adding one, or changing its prose, makes a new one", () => {
    const base = fingerprintOfPractice(withSteps(reflect, consider, respond))
    expect(base).not.toBe(fingerprintOfPractice(practice))
    expect(
      fingerprintOfPractice(
        withSteps({ ...reflect, prose: ["Read it twice."] }, consider, respond),
      ),
    ).not.toBe(base)
  })

  it("is told from another direction with the same prose", () => {
    const recall: Step = { direction: "recall", prose: reflect.prose }
    expect(fingerprintOfPractice(withSteps(reflect, respond))).not.toBe(
      fingerprintOfPractice(withSteps(recall, respond)),
    )
  })
})
