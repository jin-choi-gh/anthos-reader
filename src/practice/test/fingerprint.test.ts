import { describe, expect, it } from "vitest"
import { fingerprintOfPractice, samePractice } from "../fingerprint"
import { REST } from "../parts"
import type { EditorsNote, Practice, Step } from "../types"
import { practiceOf } from "./build"

const wormNote: EditorsNote = {
  id: "angle-worm",
  notehead: "l3 Angle Worm",
  tags: [],
  body: "The worm.",
}
const look: Step = { id: "look", ...REST, prose: ["Look."], highlight: [wormNote] }
const ask: Step = {
  id: "ask",
  ...REST,
  prose: ["What does the bird eat?"],
  writing: { target: "whole", tags: [], count: "one" },
}

const practice = practiceOf({
  id: "test",
  title: "Test",
  text: "dickinson",
  stages: [
    { name: "First", steps: [look, ask] },
    {
      name: "Second",
      steps: [{ ...REST, prose: ["Again."], recall: { from: "stage", id: "stage-1" } }],
    },
  ],
})

/** The practice with its first stage's steps replaced. */
const withSteps = (...steps: Step[]): Practice => ({
  ...practice,
  stages: [{ ...practice.stages[0]!, steps }, ...practice.stages.slice(1)],
})

describe("fingerprintOfPractice: the practice's version", () => {
  it("is the same for the same steps, as 14 hex digits", () => {
    const copy: Practice = JSON.parse(JSON.stringify(practice))
    expect(fingerprintOfPractice(copy)).toBe(fingerprintOfPractice(practice))
    expect(fingerprintOfPractice(practice)).toMatch(/^[0-9a-f]{14}$/)
  })

  it("does not change with the order the source writes a step's keys in", () => {
    const reordered: Step = {
      restore: null,
      recall: null,
      writing: null,
      highlight: [{ body: "The worm.", tags: [], notehead: "l3 Angle Worm", id: "angle-worm" }],
      prose: ["Look."],
      id: "look",
    }
    expect(fingerprintOfPractice(withSteps(reordered, ask))).toBe(fingerprintOfPractice(practice))
  })

  it("changes with any change to a step, its id and its editor's notes included, or the steps' order", () => {
    const base = fingerprintOfPractice(practice)
    const changed = [
      withSteps({ ...look, id: "looking" }, ask),
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

  it("changes with what a recall names", () => {
    const second = practice.stages[1]!
    const recalling = (recall: Step["recall"]): Practice => ({
      ...practice,
      stages: [practice.stages[0]!, { ...second, steps: [{ ...second.steps[0]!, recall }] }],
    })
    const base = fingerprintOfPractice(practice)
    expect(fingerprintOfPractice(recalling({ from: "step", id: "ask" }))).not.toBe(base)
    expect(fingerprintOfPractice(recalling({ from: "all" }))).not.toBe(base)
  })

  it("changes with a restore: what it takes out, and its gaps", () => {
    const second = practice.stages[1]!
    const restoring = (restore: Step["restore"]): Practice => ({
      ...practice,
      stages: [practice.stages[0]!, { ...second, steps: [{ ...second.steps[0]!, restore }] }],
    })
    const words = fingerprintOfPractice(restoring({ of: "words", gaps: ["l1 Bird", "l1 Walk"] }))
    expect(words).not.toBe(fingerprintOfPractice(practice))
    expect(
      fingerprintOfPractice(restoring({ of: "words", gaps: ["l1 Bird", "l1 came"] })),
    ).not.toBe(words)
    expect(
      fingerprintOfPractice(restoring({ of: "lines", gaps: ["l1 Bird", "l1 Walk"] })),
    ).not.toBe(words)
  })

  it("does not change with the title, or the stages' names, ids and days: no new run", () => {
    const changed: Practice = {
      ...practice,
      title: "Renamed",
      stages: practice.stages.map((stage, s) => ({
        ...stage,
        id: `part-${s}`,
        name: `${stage.name}, renamed`,
        days: s === 0 ? null : 3,
      })),
    }
    expect(fingerprintOfPractice(changed)).toBe(fingerprintOfPractice(practice))
  })

  it("tells two stages from one, even with the same steps in order", () => {
    const merged: Practice = {
      ...practice,
      stages: [{ ...practice.stages[0]!, steps: practice.stages.flatMap((stage) => stage.steps) }],
    }
    expect(fingerprintOfPractice(merged)).not.toBe(fingerprintOfPractice(practice))
  })
})

describe("samePractice: two practices compared whole", () => {
  it("is true for a copy, whatever order its keys are written in", () => {
    const copy: Practice = JSON.parse(JSON.stringify(practice))
    expect(samePractice(copy, practice)).toBe(true)
    expect(samePractice(withSteps({ ...look }, ask), practice)).toBe(true)
  })

  it("tells apart what the fingerprint leaves out: the title, and a stage's name, id and days", () => {
    const [first, second] = practice.stages as [Practice["stages"][0], Practice["stages"][0]]
    const changed: Practice[] = [
      { ...practice, title: "Renamed" },
      { ...practice, stages: [{ ...first, name: "Renamed" }, second] },
      { ...practice, stages: [{ ...first, id: "other" }, second] },
      { ...practice, stages: [first, { ...second, days: 2 }] },
    ]
    for (const other of changed) {
      expect(fingerprintOfPractice(other)).toBe(fingerprintOfPractice(practice))
      expect(samePractice(other, practice)).toBe(false)
    }
  })
})
