import { describe, expect, it } from "vitest"
import { nextEnabled, typedTo } from "../choosingKeys"

const options = [
  { label: "goes on" },
  { label: "looks at notes in the poem" },
  { label: "writes a response" },
  { label: "reads back what they wrote", disabled: true },
  { label: "wanders" },
]

describe("nextEnabled: where the arrows go", () => {
  it("moves one way to the next option that may be chosen, passing over those that may not", () => {
    expect(nextEnabled(options, 0, 1)).toBe(1)
    expect(nextEnabled(options, 2, 1)).toBe(4)
    expect(nextEnabled(options, 4, -1)).toBe(2)
  })

  it("stays where it is at either end, without wrapping round", () => {
    expect(nextEnabled(options, 4, 1)).toBe(4)
    expect(nextEnabled(options, 0, -1)).toBe(0)
  })

  it("finds the first and the last from outside the list", () => {
    expect(nextEnabled(options, -1, 1)).toBe(0)
    expect(nextEnabled(options, options.length, -1)).toBe(4)
  })
})

describe("typedTo: where typing goes", () => {
  it("goes to the next option beginning with a letter, ignoring case, round to the start", () => {
    expect(typedTo(options, "W", 0)).toBe(2)
    expect(typedTo(options, "w", 2)).toBe(4)
    expect(typedTo(options, "w", 4)).toBe(2)
  })

  it("stays on the option found while more letters still begin it", () => {
    expect(typedTo(options, "wa", 2)).toBe(4)
    expect(typedTo(options, "wr", 2)).toBe(2)
  })

  it("passes over options that may not be chosen, and finds none when nothing begins so", () => {
    expect(typedTo(options, "r", 0)).toBeNull()
    expect(typedTo(options, "z", 0)).toBeNull()
    expect(typedTo(options, "", 0)).toBeNull()
  })
})
