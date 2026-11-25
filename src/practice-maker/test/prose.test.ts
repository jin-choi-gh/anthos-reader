import { describe, expect, it } from "vitest"
import { paragraphsOf, proseText } from "../prose"

describe("paragraphsOf: a step's prose from one box", () => {
  it("parts paragraphs at blank lines, however many, and trims each", () => {
    expect(paragraphsOf("  Look.  \n\nAgain.\n \n\n\nOnce more.")).toEqual([
      "Look.",
      "Again.",
      "Once more.",
    ])
  })

  it("keeps a single line break in its paragraph", () => {
    expect(paragraphsOf("One line,\nand the next.")).toEqual(["One line,\nand the next."])
  })

  it("is none for a box that says nothing", () => {
    expect(paragraphsOf("")).toEqual([])
    expect(paragraphsOf(" \n\n \n")).toEqual([])
  })
})

describe("proseText: a step's prose for one box", () => {
  it("parts paragraphs with a blank line, so that paragraphsOf gives them back", () => {
    const prose = ["Look.", "One line,\nand the next."]
    expect(proseText(prose)).toBe("Look.\n\nOne line,\nand the next.")
    expect(paragraphsOf(proseText(prose))).toEqual(prose)
  })
})
