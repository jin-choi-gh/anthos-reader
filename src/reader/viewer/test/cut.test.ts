import { describe, expect, it } from "vitest"
import { cut } from "../cut"

describe("cut", () => {
  it("leaves a line no range touches whole", () => {
    expect(cut("He bit an Angle Worm", [])).toEqual([{ text: "He bit an Angle Worm", ranges: [] }])
  })

  it("cuts at every range's edges, and gives each piece the ranges covering it", () => {
    const worm = { start: 10, end: 20 }
    const angle = { start: 10, end: 15 }
    expect(cut("He bit an Angle Worm in halves", [worm, angle])).toEqual([
      { text: "He bit an ", ranges: [] },
      { text: "Angle", ranges: [worm, angle] },
      { text: " Worm", ranges: [worm] },
      { text: " in halves", ranges: [] },
    ])
  })

  it("counts offsets in code points, as loom does, not UTF-16 units", () => {
    const bird = { start: 2, end: 3 }
    expect(cut("a 🐦 b", [bird])).toEqual([
      { text: "a ", ranges: [] },
      { text: "🐦", ranges: [bird] },
      { text: " b", ranges: [] },
    ])
  })
})
