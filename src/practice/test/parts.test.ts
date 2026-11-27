import { describe, expect, it } from "vitest"
import { annotationsOf } from "../editorsNotes"
import { finalPartsOf, REST } from "../parts"
import type { Parts, Practice } from "../types"
import { practiceOf as built } from "./build"

const practiceOf = (...steps: Parts[]): Practice =>
  built({ id: "test", title: "Test", text: "dickinson", stages: [{ name: "Only", steps }] })

describe("REST", () => {
  it("says nothing and asks nothing", () => {
    expect(REST).toEqual({ prose: [], disclose: [], writing: null, recall: null, restore: null })
  })
})

describe("finalPartsOf: the final stage", () => {
  it("says the practice is done, and brings back everything written, when any step asked", () => {
    const asks = practiceOf({ ...REST, writing: { target: "whole", tags: [], count: "one" } })
    expect(finalPartsOf(asks)).toEqual({
      prose: ["Explicit."],
      disclose: [],
      writing: null,
      recall: { from: "all" },
      restore: null,
    })
  })

  it("brings back nothing when no step asked for writing", () => {
    expect(finalPartsOf(practiceOf({ ...REST, prose: ["Look."] })).recall).toBeNull()
  })
})

describe("annotationsOf: a step's editor's notes on the poem", () => {
  const substrate = {
    lines: [
      { id: "l1", text: "A Bird, came down the Walk -" },
      { id: "l2", text: "He bit an Angle Worm in halves" },
    ],
  }

  it("places each note by its notehead, in the order written, keeping its id, tags and body", () => {
    const notes = [
      { id: "worm", notehead: "l2 Worm", tags: ["gloss"], body: "The worm." },
      { id: "both", notehead: "l1 Bird && l2", tags: [], body: "Both." },
    ]
    expect(annotationsOf(substrate, notes)).toEqual([
      {
        id: "worm",
        targets: [{ start: { line: 1, offset: 16 }, end: { line: 1, offset: 20 } }],
        tags: ["gloss"],
        body: "The worm.",
      },
      {
        id: "both",
        targets: [
          { start: { line: 0, offset: 2 }, end: { line: 0, offset: 6 } },
          { start: { line: 1, offset: 0 }, end: { line: 1, offset: 30 } },
        ],
        tags: [],
        body: "Both.",
      },
    ])
  })

  it("leaves out a note whose notehead cannot be placed on these lines", () => {
    const notes = [{ id: "far", notehead: "l9", tags: [], body: "Nowhere." }]
    expect(annotationsOf(substrate, notes)).toEqual([])
  })
})
