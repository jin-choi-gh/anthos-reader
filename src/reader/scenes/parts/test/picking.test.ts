import { describe, expect, it } from "vitest"
import type { PickingSubject } from "../../types"
import { onPick, pickingOf } from "../picking"

const span = (line: number, start: number, end: number) => ({
  start: { line, offset: start },
  end: { line, offset: end },
})

const picking: PickingSubject = {
  of: "words",
  units: [
    { span: span(0, 0, 1), taken: false },
    { span: span(0, 2, 6), taken: true },
  ],
}

describe("pickingOf: the words or lines to pick, for the viewer", () => {
  it("gives each unit, and whether a gap takes it out", () => {
    expect(pickingOf(picking)).toEqual({ of: "words", units: picking.units })
  })
})

describe("onPick: a word or line picked", () => {
  it("sends out its span, for Form Practice to make a gap of it or take the gap away", () => {
    expect(onPick(picking, { kind: "pick", unit: 1 })).toEqual([
      { kind: "pick", span: span(0, 2, 6) },
    ])
  })

  it("sends out nothing for a unit that is not there", () => {
    expect(onPick(picking, { kind: "pick", unit: 5 })).toEqual([])
  })
})
