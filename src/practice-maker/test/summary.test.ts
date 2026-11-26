import { describe, expect, it } from "vitest"
import { REST } from "../../practice/parts"
import { problemsOf } from "../../practice/problems"
import { practiceOf } from "../../practice/test/build"
import type { Parts, Practice } from "../../practice/types"
import {
  excerptOf,
  isBroken,
  opensAfter,
  romanOf,
  partLabel,
  partOf,
  partWord,
  recallLabel,
  recallTargets,
  stageLabel,
  stepLabel,
} from "../summary"

const substrate = { lines: [{ id: "l1", text: "He bit an Angle Worm in halves" }] }
const note = { id: "worm", notehead: "l1 Worm", tags: [], body: "The worm." }
const say = (words: string): Parts => ({ ...REST, prose: [words] })
const ask = (words: string, target: "whole" | "chosen" = "whole"): Parts => ({
  ...REST,
  prose: [words],
  writing: { target, tags: [], count: "one" },
})

// stage-1: step-1 says, step-2 asks; stage-2 (no name): step-3 says; stage-3: step-4 asks, step-5
const practice: Practice = practiceOf({
  id: "test",
  title: "Test",
  text: "dickinson",
  stages: [
    { name: "The Bird", steps: [say("Look at the bird."), ask("What does it eat?")] },
    { name: "", steps: [say("Rest.")] },
    { name: "Nature", steps: [ask("Where?", "chosen"), say("Last.")] },
  ],
})

describe("partOf: the part a step asks besides its prose", () => {
  it("is its highlight, writing, recall or restore, or none", () => {
    expect(partOf(say("a"))).toBeNull()
    expect(partOf({ ...REST, highlight: [note] })).toBe("highlight")
    expect(partOf(ask("a"))).toBe("writing")
    expect(partOf({ ...REST, recall: { from: "stage", id: "stage-1" } })).toBe("recall")
    expect(partOf({ ...REST, restore: { of: "words", gaps: [] } })).toBe("restore")
  })

  it("takes a step with more than one by its first", () => {
    expect(partOf({ ...ask("a"), highlight: [note] })).toBe("highlight")
  })
})

describe("excerptOf: the start of a step's prose", () => {
  it("is its first line with text, whole when it is short", () => {
    expect(excerptOf(["", "  Look at the bird.\nThen the worm."])).toBe("Look at the bird.")
    expect(excerptOf([])).toBe("")
  })

  it("is cut at a word and marked … when it is long", () => {
    expect(excerptOf(["Consider how sonic features add to the poem's sense of motion"], 30)).toBe(
      "Consider how sonic features…",
    )
  })
})

describe("labels: stages, steps and recalls in words", () => {
  it("name a stage by its number and name, and a step by its stage, its number and its prose", () => {
    expect(stageLabel(practice, 0)).toBe("Stage 1 · The Bird")
    expect(stageLabel(practice, 1)).toBe("Stage 2")
    expect(stepLabel(practice, { stage: 0, step: 1 })).toBe("Stage 1, step 2 · What does it eat?")
    expect(stepLabel(practice, { stage: 9, step: 0 })).toBe("Stage 10, step 1")
  })

  it("name what a recall names, or say it is removed", () => {
    expect(recallLabel(practice, { from: "stage", id: "stage-1" })).toBe("Stage 1 · The Bird")
    expect(recallLabel(practice, { from: "step", id: "step-2" })).toBe(
      "Stage 1, step 2 · What does it eat?",
    )
    expect(recallLabel(practice, { from: "step", id: "step-9" })).toBe("step-9, removed")
    expect(recallLabel(practice, { from: "all" })).toBe("The whole practice")
  })

  it("name a step's part for the anatomy", () => {
    expect(partLabel(practice, say("a"))).toBeNull()
    expect(partLabel(practice, { ...REST, highlight: [note] })).toBe("Highlighting · 1 note")
    expect(partLabel(practice, ask("a"))).toBe("Reader response · whole poem")
    expect(partLabel(practice, ask("a", "chosen"))).toBe("Reader response · chosen passages")
    expect(partLabel(practice, { ...REST, recall: { from: "step", id: "step-2" } })).toBe(
      "Reader recall · Stage 1, step 2",
    )
    expect(partLabel(practice, { ...REST, recall: { from: "stage", id: "gone" } })).toBe(
      "Reader recall · gone, removed",
    )
  })

  it("name a restore's part for the anatomy by what it takes out", () => {
    const restore = { of: "lines", gaps: ["l1", "l2", "l3"] } as const
    expect(partLabel(practice, { ...REST, restore })).toBe("Restore · 3 lines")
  })

  it("name a step's part in a word or two for the reel's contents", () => {
    expect(partWord(say("a"))).toBeNull()
    expect(partWord({ ...REST, highlight: [note] })).toBe("1 note")
    expect(partWord({ ...REST, highlight: [note, { ...note, id: "bird" }] })).toBe("2 notes")
    expect(partWord(ask("a", "chosen"))).toBe("write")
    expect(partWord({ ...REST, recall: { from: "stage", id: "gone" } })).toBe("recall")
    expect(partWord({ ...REST, restore: { of: "words", gaps: ["l1 Bird", "l1 Walk"] } })).toBe(
      "2 words",
    )
    expect(partWord({ ...REST, restore: { of: "lines", gaps: ["l1"] } })).toBe("1 line")
  })
})

describe("recallTargets: what a recall may name", () => {
  it("is every earlier stage that asks for writing, each followed by its steps that ask", () => {
    const targets = recallTargets(practice, { stage: 2, step: 1 })
    expect(targets.map((target) => target.recall)).toEqual([
      { from: "stage", id: "stage-1" },
      { from: "step", id: "step-2" },
      { from: "step", id: "step-4" },
    ])
    expect(targets[0]?.label).toBe("Stage 1 · The Bird")
  })

  it("is nothing for the first step, and never its own stage, itself or a later step", () => {
    expect(recallTargets(practice, { stage: 0, step: 0 })).toEqual([])
    expect(recallTargets(practice, { stage: 0, step: 1 })).toEqual([])
    expect(recallTargets(practice, { stage: 2, step: 0 }).map((t) => t.recall)).toEqual([
      { from: "stage", id: "stage-1" },
      { from: "step", id: "step-2" },
    ])
  })

  it("names only what problemsOf takes there", () => {
    for (const [s, stage] of practice.stages.entries()) {
      for (const i of stage.steps.keys()) {
        for (const { recall } of recallTargets(practice, { stage: s, step: i })) {
          const recalling: Practice = {
            ...practice,
            stages: practice.stages.map((each, t) =>
              t !== s
                ? each
                : {
                    ...each,
                    steps: each.steps.map((step, j) =>
                      j === i ? { ...step, writing: null, recall } : step,
                    ),
                  },
            ),
          }
          const about = problemsOf(recalling, { substrate, words: [] }).filter(
            (p) => p.about === "recall",
          )
          expect(about, JSON.stringify(recall)).toEqual([])
        }
      }
    }
  })
})

describe("isBroken: a problem written wrong, not one not yet written", () => {
  it("is so for ids, days, parts, noteheads and recalls, and not for what is missing", () => {
    const problem = (about: Parameters<typeof isBroken>[0]["about"]) =>
      isBroken({ stage: null, step: null, note: null, about, text: "" })
    for (const about of ["id", "days", "parts", "notehead", "recall"] as const) {
      expect(problem(about), about).toBe(true)
    }
    for (const about of ["stages", "title", "name", "steps", "prose", "body"] as const) {
      expect(problem(about), about).toBe(false)
    }
  })
})

describe("romanOf and opensAfter: stages in words", () => {
  it("numbers a stage as a numeral", () => {
    expect([1, 2, 3, 4, 5, 9, 14, 40].map(romanOf)).toEqual([
      "I",
      "II",
      "III",
      "IV",
      "V",
      "IX",
      "XIV",
      "XL",
    ])
  })

  it("says when a later stage opens, and nothing for the first or for days that are wrong", () => {
    const paced = practiceOf({
      ...practice,
      stages: [
        { name: "A", steps: [] },
        { name: "B", steps: [], days: 1 },
        { name: "C", steps: [], days: 3 },
        { name: "D", steps: [], days: 0 },
      ],
    })
    expect([0, 1, 2, 3].map((s) => opensAfter(paced, s))).toEqual([
      null,
      "a day after stage I",
      "3 days after stage II",
      null,
    ])
  })
})
