import { describe, expect, it } from "vitest"
import { longestOf, shapeOf, silhouetteOf } from "../silhouette"

const measure = { width: 44, indent: 3, row: 2, gap: 1, stanzaGap: 4 }

describe("silhouetteOf: a poem's shape as bars", () => {
  it("draws one bar a line, as long as the line on the library's scale, set in by its indent", () => {
    const { bars } = silhouetteOf(
      [
        [
          { length: 32, indent: 0 },
          { length: 16, indent: 2 },
        ],
      ],
      32,
      measure,
    )
    expect(bars).toEqual([
      { x: 0, y: 0, width: 32 },
      { x: 6, y: 3, width: 16 },
    ])
  })

  it("parts stanzas by a wider gap, and gives the height the bars take", () => {
    const shape = [[{ length: 8, indent: 0 }], [{ length: 8, indent: 0 }]]
    const { bars, height } = silhouetteOf(shape, 32, measure)
    expect(bars.map((bar) => bar.y)).toEqual([0, 7])
    expect(height).toBe(9)
  })

  it("draws the same line the same length in every poem given the same longest line", () => {
    const short = silhouetteOf([[{ length: 10, indent: 0 }]], 40, measure).bars[0]
    const long = silhouetteOf(
      [
        [
          { length: 10, indent: 0 },
          { length: 40, indent: 0 },
        ],
      ],
      40,
      measure,
    ).bars[0]
    expect(short).toEqual(long)
  })

  it("keeps an empty line's row but draws no bar for it", () => {
    const { bars, height } = silhouetteOf(
      [
        [
          { length: 0, indent: 0 },
          { length: 5, indent: 0 },
        ],
      ],
      5,
      measure,
    )
    expect(bars).toEqual([{ x: 0, y: 3, width: 32 }])
    expect(height).toBe(5)
  })
})

describe("shapeOf and longestOf", () => {
  it("measures lines in code points, as loom does, and finds the longest", () => {
    const line = (text: string, indent = 0) => ({
      id: "",
      text,
      indexInSubstrate: 0,
      number: 1,
      indent,
    })
    const shape = shapeOf([{ lines: [line("ſtar"), line("𝔊lory be", 1)] }])
    expect(shape).toEqual([
      [
        { length: 4, indent: 0 },
        { length: 8, indent: 1 },
      ],
    ])
    expect(longestOf(shape)).toBe(8)
    expect(longestOf([])).toBe(0)
  })
})
