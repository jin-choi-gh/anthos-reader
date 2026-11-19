import { describe, expect, it } from "vitest"
import { DICKINSON, DICKINSON_NOTES } from "../../material/test/dickinson"
import { loadPractices, parsePractice } from "../load"
import { problemsOf } from "../problems"

describe("loadPractices: every practice file in practice-data/", () => {
  it("reads them all, with nothing it cannot read", () => {
    const { practices, problems } = loadPractices()
    expect(problems).toEqual([])
    expect(practices.map((practice) => practice.id)).toContain("first-reading")
  })

  it("gives practices with distinct ids", () => {
    const ids = loadPractices().practices.map((practice) => practice.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe("practice-data/first-reading.json", () => {
  const firstReading = loadPractices().practices.find(
    (practice) => practice.id === "first-reading",
  )!

  it("is a practice for Dickinson's poem that can run on its lines", () => {
    expect(firstReading.text).toBe("dickinson")
    expect(problemsOf(firstReading, { lines: DICKINSON })).toEqual([])
  })

  it("holds the editor's notes on the poem, each with the head written in loom's notes file", () => {
    const notes = firstReading.stages.flatMap((stage) =>
      stage.steps.flatMap((step) => step.highlight),
    )
    expect(notes.map((note) => [note.id, note.notehead])).toEqual(
      DICKINSON_NOTES.map((note) => [note.id, note.head]),
    )
  })
})

describe("parsePractice", () => {
  const practice = { id: "test", title: "Test", text: "dickinson", stages: [] }
  const file = { format: "anthos-practice", format_version: 1, ...practice }

  it("gives the practice in a practice file, without the file's marks", () => {
    expect(parsePractice(file, "test.json")).toEqual(practice)
  })

  it("refuses what is not a practice file, or of another version, naming it", () => {
    expect(() => parsePractice(practice, "test.json")).toThrow("test.json: not an anthos practice")
    expect(() => parsePractice(null, "test.json")).toThrow("test.json: not an anthos practice")
    expect(() => parsePractice({ ...file, format_version: 2 }, "test.json")).toThrow(
      "test.json: format version 2, but this reader reads version 1",
    )
  })

  it("refuses a file whose practice is not one, saying where", () => {
    expect(() => parsePractice({ ...file, stages: [{ name: "One" }] }, "test.json")).toThrow(
      "test.json: stage 1 has no steps",
    )
  })
})
