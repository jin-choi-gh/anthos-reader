import { describe, expect, it } from "vitest"
import { fingerprintOfPractice } from "../fingerprint"
import { REST } from "../parts"
import type { EditorsNote, Practice, Step } from "../types"

const wormNote: EditorsNote = {
  id: "angle-worm",
  notehead: "l3 Angle Worm",
  tags: [],
  body: "The worm.",
}
const look: Step = { ...REST, prose: ["Look."], highlight: [wormNote] }
const ask: Step = {
  ...REST,
  prose: ["What does the bird eat?"],
  writing: { target: "whole", tags: [], count: "one" },
}

const practice: Practice = {
  id: "test",
  title: "Test",
  text: "dickinson",
  stages: [
    { name: "First", steps: [look, ask] },
    { name: "Second", steps: [{ ...REST, recall: { from: "previous" } }] },
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
    const reordered: Step = {
      recall: null,
      writing: null,
      highlight: [{ body: "The worm.", tags: [], notehead: "l3 Angle Worm", id: "angle-worm" }],
      prose: ["Look."],
    }
    expect(fingerprintOfPractice(withSteps(reordered, ask))).toBe(fingerprintOfPractice(practice))
  })

  it("changes with any change to a step's parts, its editor's notes included, or the steps' order", () => {
    const base = fingerprintOfPractice(practice)
    const changed = [
      withSteps({ ...look, prose: ["Look again."] }, ask),
      withSteps({ ...look, prose: [""] }, ask),
      withSteps({ ...look, highlight: [] }, ask),
      withSteps({ ...look, highlight: [{ ...wormNote, id: "worm" }] }, ask),
      withSteps({ ...look, highlight: [{ ...wormNote, notehead: "l3 Worm" }] }, ask),
      withSteps({ ...look, highlight: [{ ...wormNote, tags: ["gloss"] }] }, ask),
      withSteps({ ...look, highlight: [{ ...wormNote, body: "The angle worm." }] }, ask),
      withSteps(look, { ...ask, writing: { target: "chosen", tags: [], count: "one" } }),
      withSteps(look, { ...ask, writing: { target: "whole", tags: ["gloss"], count: "one" } }),
      withSteps(look, { ...ask, writing: null }),
      withSteps(ask, look),
      withSteps(look),
    ]
    for (const edited of changed) expect(fingerprintOfPractice(edited)).not.toBe(base)
    expect(fingerprintOfPractice(withSteps({ ...look, prose: [] }, ask))).not.toBe(
      fingerprintOfPractice(withSteps({ ...look, prose: [""] }, ask)),
    )
  })

  it("changes with a recall's reach", () => {
    const all: Practice = {
      ...practice,
      stages: [
        practice.stages[0]!,
        { name: "Second", steps: [{ ...REST, recall: { from: "all" } }] },
      ],
    }
    expect(fingerprintOfPractice(all)).not.toBe(fingerprintOfPractice(practice))
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
