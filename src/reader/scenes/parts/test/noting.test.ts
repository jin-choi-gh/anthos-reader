import { describe, expect, it } from "vitest"
import type { Span } from "../../../../material/types"
import type { NotingSubject } from "../../types"
import {
  notingOf,
  onChoose,
  onPassages,
  onPraxisBar,
  startNoting,
  type NotingState,
} from "../noting"

/** Lines of the substrate, each with the id loom would give it: "l1", "l2", and on. */
const withIds = (texts: readonly string[]) => texts.map((text, i) => ({ id: `l${i + 1}`, text }))

const noting: NotingSubject = {
  substrate: {
    lines: withIds([
      "A Bird, came down the Walk -",
      "He did not know I saw -",
      "He bit an Angle Worm in halves",
    ]),
  },
  tags: [],
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

const choosing: NotingState = { ...startNoting(), choosing: true }

/** The state after a message from the praxis bar that sends nothing out. */
const bar = (state: NotingState, message: Parameters<typeof onPraxisBar>[2]) => {
  const answer = onPraxisBar(noting, state, message)
  expect(answer.effects).toEqual([])
  return answer.state
}
const bird = span(0, 2, 0, 6)
const he = span(1, 0, 1, 2)

describe("a new note", () => {
  it("starts with choosing off, nothing chosen, nothing written, and cannot be added", () => {
    expect(startNoting()).toEqual({ choosing: false, targets: [], draft: "" })
    expect(notingOf(noting, startNoting())).toEqual({
      choosing: false,
      chosen: [],
      draft: "",
      canAdd: false,
    })
  })

  it("turns choosing on and off, and keeps the very same state when nothing changes", () => {
    const on = onPassages(startNoting(), { kind: "choosing", on: true })
    expect(on.choosing).toBe(true)
    expect(onPassages(on, { kind: "choosing", on: false }).choosing).toBe(false)
    expect(onPassages(on, { kind: "choosing", on: true })).toBe(on)
  })
})

describe("onChoose: a passage chosen in the viewer", () => {
  it("is ignored while choosing is off", () => {
    const off = startNoting()
    expect(onChoose(noting, off, bird)).toBe(off)
  })

  it("is ignored when it breaks loom's rule for spans", () => {
    expect(onChoose(noting, choosing, span(0, 28, 1, 2))).toBe(choosing)
  })

  it("is kept in the poem's order, whatever order the passages were chosen in", () => {
    const state = onChoose(noting, onChoose(noting, choosing, he), bird)
    expect(state.targets).toEqual([bird, he])
  })

  it("is joined with any chosen passage it overlaps or touches, so that none overlap", () => {
    const state = onChoose(
      noting,
      onChoose(noting, onChoose(noting, choosing, bird), he),
      span(0, 4, 0, 12),
    )
    expect(state.targets).toEqual([span(0, 2, 0, 12), he])
    expect(onChoose(noting, state, span(0, 12, 0, 17)).targets).toEqual([span(0, 2, 0, 17), he])
  })
})

describe("removing and writing", () => {
  const two = onChoose(noting, onChoose(noting, choosing, bird), he)

  it("removes a chosen target by its place in the table", () => {
    expect(onPassages(two, { kind: "unchoose", index: 0 }).targets).toEqual([he])
  })

  it("keeps the very same state for a place the table does not have", () => {
    expect(onPassages(two, { kind: "unchoose", index: 2 })).toBe(two)
  })

  it("keeps the draft, and lets the note be added only once it says something", () => {
    const typed = bar(two, { kind: "noteDraft", text: "Worms." })
    expect(notingOf(noting, typed)).toMatchObject({ draft: "Worms.", canAdd: true })
    const blank = bar(two, { kind: "noteDraft", text: "   " })
    expect(notingOf(noting, blank).canAdd).toBe(false)
    expect(bar(typed, { kind: "noteDraft", text: "Worms." })).toBe(typed)
  })
})

describe("notingOf: each chosen target's lemma, as the notes give it", () => {
  it("quotes a passage, and cites whole lines and the whole poem", () => {
    const state: NotingState = {
      ...choosing,
      targets: [span(0, 22, 1, 6), span(2, 0, 2, 30)],
    }
    expect(notingOf(noting, state).chosen).toEqual([
      { kind: "quote", text: "Walk - / He did" },
      { kind: "citation", text: "line 3" },
    ])
    const whole: NotingState = { ...choosing, targets: [span(0, 0, 2, 30)] }
    expect(notingOf(noting, whole).chosen).toEqual([{ kind: "citation", text: "the whole poem" }])
  })
})

describe("addNote: the note added", () => {
  const two = onChoose(noting, onChoose(noting, choosing, he), bird)
  const typed = { ...two, draft: "  Worms and beads.  " }

  it("sends out a new note on the chosen targets, in the poem's order, with the draft trimmed", () => {
    expect(onPraxisBar(noting, typed, { kind: "addNote" }).effects).toEqual([
      { kind: "note", targets: [bird, he], tags: [], body: "Worms and beads." },
    ])
  })

  it("is a note on the whole poem when no passage is chosen", () => {
    const plain = { ...startNoting(), draft: "Worms." }
    expect(onPraxisBar(noting, plain, { kind: "addNote" }).effects).toEqual([
      { kind: "note", targets: [span(0, 0, 2, 30)], tags: [], body: "Worms." },
    ])
  })

  it("carries the subject's tags", () => {
    const tagged = { ...noting, tags: ["gloss"] }
    const [effect] = onPraxisBar(tagged, typed, { kind: "addNote" }).effects
    expect(effect).toMatchObject({ tags: ["gloss"] })
  })

  it("then starts a new note, keeping whether choosing is on", () => {
    expect(onPraxisBar(noting, typed, { kind: "addNote" }).state).toEqual({
      choosing: true,
      targets: [],
      draft: "",
    })
    const off = { ...typed, choosing: false }
    expect(onPraxisBar(noting, off, { kind: "addNote" }).state.choosing).toBe(false)
  })

  it("adds nothing while the draft says nothing, and keeps the very same state", () => {
    const blank = { ...two, draft: "   " }
    expect(onPraxisBar(noting, blank, { kind: "addNote" })).toEqual({ state: blank, effects: [] })
    expect(onPraxisBar(noting, blank, { kind: "addNote" }).state).toBe(blank)
  })
})

describe("takeUp: a note taken in hand, to write again", () => {
  it("makes its targets the chosen ones, in the poem's order, and its words the draft", () => {
    const taken = bar(startNoting(), { kind: "takeUp", targets: [he, bird], text: "Worms." })
    expect(taken).toEqual({ choosing: false, targets: [bird, he], draft: "Worms." })
    expect(bar(choosing, { kind: "takeUp", targets: [he], text: "" }).choosing).toBe(true)
  })

  it("joins targets that overlap or touch, as chosen passages are", () => {
    const taken = bar(choosing, {
      kind: "takeUp",
      targets: [span(0, 2, 0, 6), span(0, 4, 0, 10)],
      text: "A bird.",
    })
    expect(taken.targets).toEqual([span(0, 2, 0, 10)])
  })

  it("chooses nothing for a note on the whole poem, which is what nothing chosen means", () => {
    const taken = bar(choosing, { kind: "takeUp", targets: [span(0, 0, 2, 30)], text: "All." })
    expect(taken.targets).toEqual([])
    expect(onPraxisBar(noting, taken, { kind: "addNote" }).effects).toEqual([
      { kind: "note", targets: [span(0, 0, 2, 30)], tags: [], body: "All." },
    ])
  })

  it("puts the note in hand down when none and nothing are taken up", () => {
    const taken = bar(choosing, { kind: "takeUp", targets: [he], text: "Worms." })
    expect(bar(taken, { kind: "takeUp", targets: [], text: "" })).toEqual(choosing)
  })

  it("sends the note out again, on its passages as chosen now, when it is added", () => {
    const taken = bar(choosing, { kind: "takeUp", targets: [he], text: "Worms." })
    const more = onChoose(noting, taken, bird)
    expect(onPraxisBar(noting, more, { kind: "addNote" }).effects).toEqual([
      { kind: "note", targets: [bird, he], tags: [], body: "Worms." },
    ])
  })
})
