import { describe, expect, it } from "vitest"
import { REST } from "../../practice/parts"
import { problemsOf } from "../../practice/problems"
import { practiceOf } from "../../practice/test/build"
import { draftToKeep, newPractice, originOf } from "../draft"

const substrate = { lines: [{ id: "l1", text: "A Bird, came down the Walk -" }] }

const practice = (id: string, title = id, text = "dickinson") =>
  practiceOf({ id, title, text, stages: [{ name: "One", steps: [{ ...REST, prose: ["Look."] }] }] })

describe("newPractice: a practice to start writing", () => {
  it("has the id given, no title, and one stage with one step, with ids and nothing written", () => {
    expect(newPractice("dickinson", "abc")).toEqual({
      id: "abc",
      title: "",
      text: "dickinson",
      stages: [{ id: "stage-1", name: "", days: null, steps: [{ id: "step-1", ...REST }] }],
    })
  })

  it("has only what is missing for its problems: a title, a stage's name, a step's prose", () => {
    const about = problemsOf(newPractice("dickinson", "abc"), { substrate, words: [] }).map(
      (p) => p.about,
    )
    expect(about).toEqual(["title", "name", "prose"])
  })
})

describe("originOf: where a draft started from", () => {
  const file = practice("first-reading")
  const saved = practice("first-reading", "Saved")

  it("is the practice saved with its id, last saved first, before a file with it", () => {
    const later = practice("first-reading", "Later")
    expect(originOf(file, [file], [saved, later])).toEqual({ from: "saved", practice: later })
  })

  it("is the practice file with its id when none is saved", () => {
    expect(originOf(saved, [file], [])).toEqual({ from: "file", practice: file })
  })

  it("is new when nothing has its id, or only for another text", () => {
    expect(originOf(practice("mine"), [file], [saved])).toEqual({ from: "new" })
    const elsewhere = practice("first-reading", "Elsewhere", "herbert")
    expect(originOf(elsewhere, [file], [saved])).toEqual({ from: "new" })
  })
})

describe("draftToKeep: what is kept in the browser after a change", () => {
  const file = practice("first-reading")

  it("is the draft, when it differs from where it started", () => {
    const retitled = { ...file, title: "Retitled" }
    expect(draftToKeep(retitled, { from: "file", practice: file })).toBe(retitled)
  })

  it("is nothing, when the draft is back to just where it started, whatever its key order", () => {
    const copy = JSON.parse(JSON.stringify(file))
    expect(draftToKeep(copy, { from: "file", practice: file })).toBeNull()
    expect(draftToKeep(copy, { from: "saved", practice: file })).toBeNull()
  })

  it("is always a new practice, which has nowhere to go back to", () => {
    const fresh = newPractice("dickinson", "abc")
    expect(draftToKeep(fresh, { from: "new" })).toBe(fresh)
  })
})
