import { describe, expect, it } from "vitest"
import { DICKINSON, DICKINSON_NOTES } from "../../material/test/dickinson"
import firstReadingFile from "../../../practice-data/first-reading.json?raw"
import { loadPractices, parsePractice, practiceFileOf } from "../load"
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
    expect(problemsOf(firstReading, { substrate: { lines: DICKINSON }, words: [] })).toEqual([])
  })

  it("opens its second stage a day after the first, and brings back there what was written in it", () => {
    const [first, second] = firstReading.stages
    expect([first?.id, first?.days, second?.id, second?.days]).toEqual([
      "stage-1",
      null,
      "stage-2",
      1,
    ])
    expect(second?.steps[0]?.recall).toEqual({ from: "stage", id: "stage-1" })
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
  const file = { format: "anthos-practice", format_version: 3, ...practice }

  it("gives the practice in a practice file, without the file's marks", () => {
    expect(parsePractice(file, "test.json")).toEqual(practice)
  })

  it("refuses what is not a practice file, or of another version, naming it", () => {
    expect(() => parsePractice(practice, "test.json")).toThrow("test.json: not an anthos practice")
    expect(() => parsePractice(null, "test.json")).toThrow("test.json: not an anthos practice")
    expect(() => parsePractice({ ...file, format_version: 2 }, "test.json")).toThrow(
      "test.json: format version 2, but this reader reads version 3",
    )
  })

  it("refuses a file whose practice is not one, saying where", () => {
    const stages = [{ id: "stage-1", name: "One", days: null }]
    expect(() => parsePractice({ ...file, stages }, "test.json")).toThrow(
      "test.json: stage 1 has no steps",
    )
  })
})

describe("practiceFileOf: a practice, written as a practice file", () => {
  const firstReading = parsePractice(JSON.parse(firstReadingFile), "first-reading.json")

  it("writes a practice file as practice-data/ keeps it, already formatted", () => {
    expect(practiceFileOf(firstReading)).toBe(firstReadingFile.replace(/\r\n/g, "\n"))
  })

  it("is read back by parsePractice as the very same practice", () => {
    const again = parsePractice(JSON.parse(practiceFileOf(firstReading)), "again.json")
    expect(again).toEqual(firstReading)
  })

  it("writes a list too long for one line one item to a line, and reads it back", () => {
    const gaps = Array.from({ length: 30 }, (_, i) => `l${i + 1}`)
    const [stage] = firstReading.stages
    const step = { ...stage!.steps[0]!, restore: { of: "lines", gaps } as const }
    const practice = { ...firstReading, stages: [{ ...stage!, steps: [step] }] }
    const file = practiceFileOf(practice)
    expect(file).toContain(`"gaps": [\n              "l1",\n              "l2",`)
    expect(parsePractice(JSON.parse(file), "long.json")).toEqual(practice)
  })
})
