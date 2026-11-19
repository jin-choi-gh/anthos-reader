import { describe, expect, it } from "vitest"
import type { Substrate } from "../../material/types"
import { REST } from "../parts"
import { problemsOf } from "../problems"
import type { EditorsNote, Practice, Stage, Step } from "../types"

const substrate: Substrate = {
  lines: [
    { id: "l1", text: "He bit an Angle Worm in halves" },
    { id: "l2", text: "And ate the fellow, raw," },
  ],
}

const note = (id: string, notehead = "l1 Worm"): EditorsNote => ({
  id,
  notehead,
  tags: [],
  body: "A note.",
})
const say: Step = { ...REST, prose: ["Look."] }
const ask: Step = { ...REST, prose: ["Why?"], writing: { target: "whole", tags: [], count: "one" } }
const recall: Step = { ...REST, prose: ["You wrote:"], recall: { from: "previous" } }
const look = (...notes: EditorsNote[]): Step => ({ ...REST, highlight: notes })

const stage = (name: string, ...steps: Step[]): Stage => ({ name, steps })
const practiceOf = (...stages: Stage[]): Practice => ({
  id: "test",
  title: "Test",
  text: "dickinson",
  stages,
})

describe("problemsOf: what keeps a practice from running on its text", () => {
  it("finds nothing in a practice that can run", () => {
    const fine = practiceOf(stage("One", say, look(note("worm")), ask), stage("Two", recall, ask))
    expect(problemsOf(fine, substrate)).toEqual([])
  })

  it("refuses a practice with no stages, and a stage with no steps", () => {
    expect(problemsOf(practiceOf(), substrate)).toEqual(["no stages"])
    expect(problemsOf(practiceOf(stage("Empty")), substrate)).toEqual(['stage 1 "Empty": no steps'])
  })

  it("refuses a step that says nothing and asks nothing, as a rest does", () => {
    const blank: Step = { ...REST, prose: ["", "  "] }
    expect(problemsOf(practiceOf(stage("One", REST, blank)), substrate)).toEqual([
      'stage 1 "One", step 1: says nothing and asks nothing',
      'stage 1 "One", step 2: says nothing and asks nothing',
    ])
  })

  it("takes a step that only asks, or only highlights, or only recalls", () => {
    const quiet = { ...ask, prose: [] }
    expect(problemsOf(practiceOf(stage("One", quiet, look(note("worm")))), substrate)).toEqual([])
    expect(
      problemsOf(practiceOf(stage("One", ask), stage("Two", { ...recall, prose: [] })), substrate),
    ).toEqual([])
  })

  it("refuses a note id loom would not take, and one already used in the practice", () => {
    const practice = practiceOf(
      stage("One", look(note("worm"), note("bad id"))),
      stage("Two", look(note("worm"), note("bird.1"))),
    )
    expect(problemsOf(practice, substrate)).toEqual([
      'stage 1 "One", step 1: the note id "bad id" is not an id: use letters, digits, - and _',
      'stage 2 "Two", step 1: the note id worm is already the id of a note in stage 1 "One", step 1',
      'stage 2 "Two", step 1: the note id "bird.1" is not an id: use letters, digits, - and _',
    ])
  })

  it("refuses a notehead that cannot be placed on the text's lines, saying why", () => {
    const practice = practiceOf(stage("One", look(note("bird", "l1 Bird"), note("far", "l9"))))
    expect(problemsOf(practice, substrate)).toEqual([
      'stage 1 "One", step 1: the note bird: l1 "Bird": "Bird" is not in line l1: "He bit an Angle Worm in halves"',
      'stage 1 "One", step 1: the note far: no line called l9',
    ])
  })

  it("refuses a step that both highlights and recalls, since a step shows one set of notes", () => {
    const both: Step = { ...recall, highlight: [note("worm")] }
    expect(problemsOf(practiceOf(stage("One", ask), stage("Two", both)), substrate)).toEqual([
      'stage 2 "Two", step 1: both highlights and recalls, but a step shows one set of notes',
    ])
  })

  it("refuses a recall in the first stage, and one of the stage before when it asks for no writing", () => {
    expect(problemsOf(practiceOf(stage("One", recall)), substrate)).toEqual([
      'stage 1 "One", step 1: a recall in the first stage, with no stage before it',
    ])
    expect(problemsOf(practiceOf(stage("One", say), stage("Two", recall)), substrate)).toEqual([
      'stage 2 "Two", step 1: a recall, but the stage before asks for nothing to be written',
    ])
    expect(
      problemsOf(
        practiceOf(stage("One", ask), stage("Two", say), stage("Three", recall)),
        substrate,
      ),
    ).toEqual([
      'stage 3 "Three", step 1: a recall, but the stage before asks for nothing to be written',
    ])
  })

  it("takes a recall of every stage before when any of them asks for writing, not only the last", () => {
    const all: Step = { ...recall, recall: { from: "all" } }
    const practice = practiceOf(stage("One", ask), stage("Two", say), stage("Three", all))
    expect(problemsOf(practice, substrate)).toEqual([])
  })

  it("refuses a recall of every stage before when none of them asks for writing", () => {
    const all: Step = { ...recall, recall: { from: "all" } }
    const practice = practiceOf(stage("One", say), stage("Two", say), stage("Three", all))
    expect(problemsOf(practice, substrate)).toEqual([
      'stage 3 "Three", step 1: a recall, but no stage before asks for anything to be written',
    ])
  })
})
