import { describe, expect, it } from "vitest"
import type { Span, Substrate } from "../../../material/types"
import {
  choose,
  givenOut,
  inHand,
  onPassages,
  passagesOf,
  sameTargets,
  type Passages,
} from "../passages"

/** Lines of the substrate, each with the id loom would give it: "l1", "l2", and on. */
const withIds = (texts: readonly string[]) => texts.map((text, i) => ({ id: `l${i + 1}`, text }))

const substrate: Substrate = {
  lines: withIds([
    "A Bird, came down the Walk -",
    "He did not know I saw -",
    "He bit an Angle Worm in halves",
  ]),
}

const span = (
  startLine: number,
  startOffset: number,
  endLine: number,
  endOffset: number,
): Span => ({
  start: { line: startLine, offset: startOffset },
  end: { line: endLine, offset: endOffset },
})

const whole = span(0, 0, 2, 30)
const bird = span(0, 2, 0, 6)
const he = span(1, 0, 1, 2)
const off: Passages = { choosing: false, targets: [] }
const on: Passages = { choosing: true, targets: [] }

describe("choose: a passage chosen in the viewer", () => {
  it("joins the targets while choosing is on, in the poem's order", () => {
    expect(choose(substrate, choose(substrate, on, he), bird).targets).toEqual([bird, he])
  })

  it("is joined with any it overlaps or touches", () => {
    const state = choose(substrate, { ...on, targets: [bird] }, span(0, 6, 0, 12))
    expect(state.targets).toEqual([span(0, 2, 0, 12)])
  })

  it("is ignored while choosing is off, or when it breaks loom's rule, giving back the same", () => {
    expect(choose(substrate, off, bird)).toBe(off)
    expect(choose(substrate, on, span(0, 28, 1, 2))).toBe(on)
  })

  it("keeps whatever else the state holds", () => {
    const state = { ...on, draft: "Worms." }
    expect(choose(substrate, state, bird)).toEqual({ ...state, targets: [bird] })
  })
})

describe("onPassages: the toggle and −", () => {
  it("turns choosing on and off, giving back the same when nothing changes", () => {
    expect(onPassages(off, { kind: "choosing", on: true })).toEqual(on)
    expect(onPassages(on, { kind: "choosing", on: true })).toBe(on)
  })

  it("removes a target by its place, and ignores a place the table does not have", () => {
    const two = { ...on, targets: [bird, he] }
    expect(onPassages(two, { kind: "unchoose", index: 0 }).targets).toEqual([he])
    expect(onPassages(two, { kind: "unchoose", index: 2 })).toBe(two)
  })
})

describe("passagesOf: what the praxis bar draws", () => {
  it("gives whether choosing is on, and each target's lemma", () => {
    expect(passagesOf(substrate, { choosing: true, targets: [bird, span(2, 0, 2, 30)] })).toEqual({
      choosing: true,
      chosen: [
        { kind: "quote", text: "Bird" },
        { kind: "quote", text: "He bit an Angle Worm in halves" },
      ],
    })
  })
})

describe("inHand: a note's targets, taken up to be chosen again", () => {
  it("are joined where they overlap or touch, and put in the poem's order", () => {
    expect(inHand(substrate, [he, bird, span(0, 6, 0, 12)])).toEqual([span(0, 2, 0, 12), he])
  })

  it("are none for a note on the whole poem, so that a passage chosen is not lost in it", () => {
    expect(inHand(substrate, [whole])).toEqual([])
    expect(inHand(substrate, [whole, bird])).toEqual([])
  })
})

describe("givenOut and sameTargets", () => {
  it("gives out the targets chosen, or the whole poem when none is", () => {
    expect(givenOut(substrate, [bird])).toEqual([bird])
    expect(givenOut(substrate, [])).toEqual([whole])
  })

  it("compares targets span for span, in order", () => {
    expect(sameTargets([bird, he], [span(0, 2, 0, 6), span(1, 0, 1, 2)])).toBe(true)
    expect(sameTargets([bird, he], [he, bird])).toBe(false)
    expect(sameTargets([bird], [bird, he])).toBe(false)
    expect(sameTargets([], [])).toBe(true)
  })

  it("makes inHand and givenOut agree: what is given out, taken in hand, is what was chosen", () => {
    for (const chosen of [[], [bird], [bird, he]]) {
      expect(inHand(substrate, givenOut(substrate, chosen))).toEqual(chosen)
    }
  })
})
