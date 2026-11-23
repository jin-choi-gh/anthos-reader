import { describe, expect, it } from "vitest"
import type { Substrate } from "../../material/types"
import { REST } from "../parts"
import { problemsOf, wordedProblem } from "../problems"
import type { EditorsNote, Parts, Practice, Recall } from "../types"
import { practiceOf as built, type StageSketch } from "./build"

const substrate: Substrate = {
  lines: [
    { id: "l1", text: "He bit an Angle Worm in halves" },
    { id: "l2", text: "And ate the fellow, raw," },
  ],
}

const note = (id: string, notehead = "l1 Worm", body = "A note."): EditorsNote => ({
  id,
  notehead,
  tags: [],
  body,
})
const say: Parts = { ...REST, prose: ["Look."] }
const ask: Parts = {
  ...REST,
  prose: ["Why?"],
  writing: { target: "whole", tags: [], count: "one" },
}
const recalling = (recall: Recall): Parts => ({ ...REST, prose: ["You wrote:"], recall })
const look = (...notes: EditorsNote[]): Parts => ({ ...REST, prose: ["See."], highlight: notes })

const stage = (name: string, ...steps: Parts[]): StageSketch => ({ name, steps })
const practiceOf = (...stages: StageSketch[]): Practice =>
  built({ id: "test", title: "Test", text: "dickinson", stages })

/** A practice's problems, each in words. */
const words = (practice: Practice) =>
  problemsOf(practice, substrate).map((problem) => wordedProblem(practice, problem))

describe("problemsOf: what keeps a practice from running on its text", () => {
  it("finds nothing in a practice that can run", () => {
    const fine = practiceOf(
      stage("One", say, look(note("worm")), ask),
      stage(
        "Two",
        recalling({ from: "stage", id: "stage-1" }),
        ask,
        recalling({ from: "step", id: "step-5" }),
      ),
    )
    expect(problemsOf(fine, substrate)).toEqual([])
  })

  it("refuses a practice with no title or no stages, and a stage with no name or no steps", () => {
    expect(words({ ...practiceOf(), title: " " })).toEqual(["no title", "no stages"])
    expect(words(practiceOf(stage("Empty")))).toEqual(['stage 1 "Empty": no steps'])
    expect(words(practiceOf(stage("  ", say)))).toEqual(["stage 1: no name"])
  })

  it("gives each problem with its place and what it is about", () => {
    const practice = practiceOf(stage("One", say, look(note("worm", "l9"))))
    expect(problemsOf(practice, substrate)).toEqual([
      { stage: 0, step: 1, note: 0, about: "notehead", text: "no line called l9" },
    ])
    expect(problemsOf({ ...practice, title: "" }, substrate)[0]).toEqual({
      stage: null,
      step: null,
      note: null,
      about: "title",
      text: "no title",
    })
  })

  it("refuses a step with no prose, as a rest has none", () => {
    expect(words(practiceOf(stage("One", REST, { ...say, prose: ["", "  "] })))).toEqual([
      'stage 1 "One", step 1: no prose',
      'stage 1 "One", step 2: no prose',
    ])
  })

  it("refuses a step with more than one of highlight, writing and recall", () => {
    const both = { ...ask, highlight: [note("worm")] }
    expect(words(practiceOf(stage("One", both)))).toEqual([
      'stage 1 "One", step 1: more than one of highlight, writing and recall: a step asks one thing',
    ])
    const recalls = { ...recalling({ from: "stage", id: "stage-1" }), writing: ask.writing }
    expect(problemsOf(practiceOf(stage("One", ask), stage("Two", recalls)), substrate)).toEqual([
      expect.objectContaining({ stage: 1, step: 0, about: "parts" }),
    ])
  })

  it("refuses days on the first stage, and later days that are not a whole number of at least 1", () => {
    const practice = built({
      id: "test",
      title: "Test",
      text: "dickinson",
      stages: [
        { name: "One", steps: [say], days: 1 },
        { name: "Two", steps: [say], days: 0 },
        { name: "Three", steps: [say], days: 1.5 },
        { name: "Four", steps: [say], days: null },
        { name: "Five", steps: [say], days: 3 },
      ],
    })
    expect(words(practice)).toEqual([
      'stage 1 "One": days on the first stage, which is open from the start',
      'stage 2 "Two": its days must be a whole number of at least 1',
      'stage 3 "Three": its days must be a whole number of at least 1',
      'stage 4 "Four": its days must be a whole number of at least 1',
    ])
  })

  it("refuses an id loom would not take, and one another of its kind already has", () => {
    const practice = built({
      id: "test",
      title: "Test",
      text: "dickinson",
      stages: [
        { name: "One", id: "part", steps: [{ ...look(note("worm"), note("bad id")), id: "a" }] },
        { name: "Two", id: "part", steps: [{ ...look(note("worm"), note("bird.1")), id: "a" }] },
        { name: "Three", id: "a b", steps: [{ ...say, id: "part" }] },
      ],
    })
    expect(words(practice)).toEqual([
      'stage 1 "One", step 1, note 2: the id "bad id" is not an id: use letters, digits, - and _',
      'stage 2 "Two": the id part is already the id of stage 1 "One"',
      'stage 2 "Two", step 1: the id a is already the id of stage 1 "One", step 1',
      'stage 2 "Two", step 1, note 1: the id worm is already the id of stage 1 "One", step 1, note 1',
      'stage 2 "Two", step 1, note 2: the id "bird.1" is not an id: use letters, digits, - and _',
      'stage 3 "Three": the id "a b" is not an id: use letters, digits, - and _',
    ])
  })

  it("refuses a note with no body, and a notehead that cannot be placed on the text's lines", () => {
    const practice = practiceOf(
      stage("One", look(note("bird", "l1 Bird"), note("far", "l9"), note("empty", "l1", " "))),
    )
    expect(words(practice)).toEqual([
      'stage 1 "One", step 1, note 1: l1 "Bird": "Bird" is not in line l1: "He bit an Angle Worm in halves"',
      'stage 1 "One", step 1, note 2: no line called l9',
      'stage 1 "One", step 1, note 3: no body',
    ])
  })

  it("takes a recall of an earlier step in the same stage that asks for writing", () => {
    const practice = practiceOf(stage("One", ask, recalling({ from: "step", id: "step-1" })))
    expect(problemsOf(practice, substrate)).toEqual([])
  })

  it("refuses a recall of the whole practice, which only the final stage makes", () => {
    expect(words(practiceOf(stage("One", ask), stage("Two", recalling({ from: "all" }))))).toEqual([
      'stage 2 "Two", step 1: a recall of the whole practice, which only the final stage makes',
    ])
  })

  it("refuses a recall naming a stage or step that is not there", () => {
    const practice = practiceOf(
      stage("One", ask),
      stage(
        "Two",
        recalling({ from: "stage", id: "stage-9" }),
        recalling({ from: "step", id: "gone" }),
      ),
    )
    expect(words(practice)).toEqual([
      'stage 2 "Two", step 1: recalls the stage stage-9, which is not there',
      'stage 2 "Two", step 2: recalls the step gone, which is not there',
    ])
  })

  it("refuses a recall of its own stage, a later one, itself, or a later step", () => {
    const practice = practiceOf(
      stage(
        "One",
        ask,
        recalling({ from: "stage", id: "stage-1" }),
        recalling({ from: "stage", id: "stage-2" }),
        recalling({ from: "step", id: "step-4" }),
        recalling({ from: "step", id: "step-6" }),
      ),
      stage("Two", ask),
    )
    expect(words(practice)).toEqual([
      'stage 1 "One", step 2: recalls stage 1, which does not come before it',
      'stage 1 "One", step 3: recalls stage 2, which does not come before it',
      'stage 1 "One", step 4: recalls stage 1, step 4, which does not come before it',
      'stage 1 "One", step 5: recalls stage 2, step 1, which does not come before it',
    ])
  })

  it("refuses a recall of a stage none of whose steps asks for writing, or of a step that does not", () => {
    const practice = practiceOf(
      stage("One", say, look(note("worm"))),
      stage(
        "Two",
        recalling({ from: "stage", id: "stage-1" }),
        recalling({ from: "step", id: "step-1" }),
      ),
    )
    expect(words(practice)).toEqual([
      'stage 2 "Two", step 1: recalls stage 1, which asks for nothing to be written',
      'stage 2 "Two", step 2: recalls stage 1, step 1, which asks for nothing to be written',
    ])
  })
})

describe("wordedProblem: a problem in words", () => {
  it("puts its place first, the stage's name with it when it has one", () => {
    const practice = practiceOf(stage("One", say), stage("", say))
    const problem = { stage: 0, step: 0, note: 2, about: "body", text: "no body" } as const
    expect(wordedProblem(practice, problem)).toBe('stage 1 "One", step 1, note 3: no body')
    expect(wordedProblem(practice, { ...problem, stage: 1, note: null })).toBe(
      "stage 2, step 1: no body",
    )
    expect(wordedProblem(practice, { ...problem, stage: null, step: null, note: null })).toBe(
      "no body",
    )
  })
})
