import { describe, expect, it } from "vitest"
import { FINAL, partsOf, REST } from "../lexicon"

describe("partsOf: a direction as the parts the viewer and the praxis bar draw", () => {
  it("consider: its prose, and the highlight on the note it names; nothing to write", () => {
    expect(partsOf({ direction: "consider", note: "@beads", prose: ["Look."] })).toEqual({
      prose: ["Look."],
      highlight: ["@beads"],
      writing: null,
      recall: null,
    })
  })

  it("respond: its prose, nothing picked out, and one note on the whole poem to write", () => {
    expect(partsOf({ direction: "respond", prose: ["What does the bird eat?"] })).toEqual({
      prose: ["What does the bird eat?"],
      highlight: [],
      writing: { target: "whole", tags: [], count: "one" },
      recall: null,
    })
  })

  it("observe: its prose, nothing picked out, and one note on passages the reader chooses", () => {
    expect(partsOf({ direction: "observe", prose: ["Where does the bird change?"] })).toEqual({
      prose: ["Where does the bird change?"],
      highlight: [],
      writing: { target: "chosen", tags: [], count: "one" },
      recall: null,
    })
  })

  it("recall: its prose, and the reader's notes from the stage before; nothing to write", () => {
    expect(partsOf({ direction: "recall", prose: ["Yesterday, you wrote:"] })).toEqual({
      prose: ["Yesterday, you wrote:"],
      highlight: [],
      writing: null,
      recall: { from: "previous" },
    })
  })

  it("hands on the reel's own prose, not a copy", () => {
    const prose = ["Look."]
    expect(partsOf({ direction: "consider", note: "@a", prose }).prose).toBe(prose)
  })
})

describe("the rest and the final stage, which the runner adds", () => {
  it("the rest asks nothing and says nothing: the praxis bar's buttons speak for it", () => {
    expect(REST).toEqual({ prose: [], highlight: [], writing: null, recall: null })
  })

  it("the final stage says the practice is done", () => {
    expect(FINAL).toEqual({
      prose: ["You have finished!"],
      highlight: [],
      writing: null,
      recall: null,
    })
  })
})
