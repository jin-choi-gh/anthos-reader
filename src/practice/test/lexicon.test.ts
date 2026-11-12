import { describe, expect, it } from "vitest"
import { FINAL, partsOf, REST } from "../lexicon"

describe("partsOf: a direction as the parts the screen draws", () => {
  it("consider: its prose, and the highlight on the note it names; nothing to write", () => {
    expect(partsOf({ direction: "consider", note: "@beads", prose: ["Look."] })).toEqual({
      prose: ["Look."],
      highlight: ["@beads"],
      writing: null,
    })
  })

  it("respond: its prose, nothing picked out, and one note on the whole poem to write", () => {
    expect(partsOf({ direction: "respond", prose: ["What does the bird eat?"] })).toEqual({
      prose: ["What does the bird eat?"],
      highlight: [],
      writing: { anchor: "whole", count: "one" },
    })
  })

  it("hands on the reel's own prose, not a copy", () => {
    const prose = ["Look."]
    expect(partsOf({ direction: "consider", note: "@a", prose }).prose).toBe(prose)
  })
})

describe("the cards the projector splices in", () => {
  it("the rest asks nothing and says nothing: the praxis bar's buttons speak for it", () => {
    expect(REST).toEqual({ prose: [], highlight: [], writing: null })
  })

  it("the final stage says the practice is done", () => {
    expect(FINAL).toEqual({ prose: ["You have finished!"], highlight: [], writing: null })
  })
})
