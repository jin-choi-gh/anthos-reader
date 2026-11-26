import { describe, expect, it } from "vitest"
import type { Substrate } from "../../material/types"
import { gapsOf, slipsOf } from "../restore"

const substrate: Substrate = {
  lines: [
    { id: "l1", text: "A Bird, came down the Walk -" },
    { id: "l2", text: "He bit an Angle Worm in halves" },
  ],
}

describe("gapsOf: a restore's gaps, placed", () => {
  it("places each gap by its notehead, in the poem's order, with its place in the restore and its text", () => {
    expect(gapsOf(substrate, { of: "words", gaps: ["l2 Worm", "l1 Walk", "l1 Bird"] })).toEqual([
      {
        index: 2,
        notehead: "l1 Bird",
        span: { start: { line: 0, offset: 2 }, end: { line: 0, offset: 6 } },
        text: "Bird",
      },
      {
        index: 1,
        notehead: "l1 Walk",
        span: { start: { line: 0, offset: 22 }, end: { line: 0, offset: 26 } },
        text: "Walk",
      },
      {
        index: 0,
        notehead: "l2 Worm",
        span: { start: { line: 1, offset: 16 }, end: { line: 1, offset: 20 } },
        text: "Worm",
      },
    ])
  })

  it("takes a whole line out, punctuation and all", () => {
    expect(gapsOf(substrate, { of: "lines", gaps: ["l1"] }).map((gap) => gap.text)).toEqual([
      "A Bird, came down the Walk -",
    ])
  })

  it("leaves out a gap that cannot be placed, keeping the others' places", () => {
    const gaps = gapsOf(substrate, { of: "words", gaps: ["l9 Bird", "l1 Bird"] })
    expect(gaps.map((gap) => [gap.index, gap.text])).toEqual([[1, "Bird"]])
  })
})

describe("slipsOf: the order the reader is given the slips in", () => {
  it("is alphabetical, whatever the case", () => {
    expect(slipsOf(["walk", "Bird", "angle", "Worm"])).toEqual(["angle", "Bird", "walk", "Worm"])
  })

  it("puts texts that differ only in case or accents in one order, always", () => {
    expect(slipsOf(["the", "The", "thé"])).toEqual(slipsOf(["thé", "The", "the"]))
  })

  it("orders whole lines by their words, and keeps slips with the same text", () => {
    expect(slipsOf(["He bit an Angle", "A Bird, came", "He bit an Angle"])).toEqual([
      "A Bird, came",
      "He bit an Angle",
      "He bit an Angle",
    ])
  })
})
