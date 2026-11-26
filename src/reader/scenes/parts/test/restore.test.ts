import { describe, expect, it } from "vitest"
import type { Span } from "../../../../material/types"
import type { RestoreMessage, RestoreSubject } from "../../types"
import {
  gapsOf,
  keepRestoring,
  onPraxisBar,
  onViewer,
  startRestoring,
  trayOf,
  type RestoreState,
} from "../restore"

/** A span in the first line, from one offset to another. */
const span = (start: number, end: number): Span => ({
  start: { line: 0, offset: start },
  end: { line: 0, offset: end },
})

/** Three gaps, in the poem's order: "the", "Bird", "the"; the slips in alphabetical order. */
const game: RestoreSubject = {
  of: "words",
  gaps: [
    { span: span(0, 3), text: "the" },
    { span: span(4, 8), text: "Bird" },
    { span: span(9, 12), text: "the" },
  ],
  slips: ["Bird", "the", "the"],
  restored: false,
}
const won: RestoreSubject = { ...game, restored: true }

const take = (slip: number): RestoreMessage => ({ kind: "take", slip })
const check: RestoreMessage = { kind: "check" }
const empty = (gap: number) => ({ kind: "empty", gap }) as const

/** The state after these messages, from a fresh game, each changing nothing in the notebook or the
 * log but the last. */
function played(...messages: (RestoreMessage | ReturnType<typeof empty>)[]): RestoreState {
  let state = startRestoring(game)
  for (const message of messages) {
    if (message.kind === "empty") {
      state = onViewer(state, message)
    } else {
      state = onPraxisBar(game, state, message).state
    }
  }
  return state
}

describe("startRestoring", () => {
  it("starts with every gap empty, nothing restored and nothing given back", () => {
    expect(startRestoring(game)).toEqual({
      filled: [null, null, null],
      restored: [false, false, false],
      returned: null,
    })
  })

  it("starts a step restored already with every gap restored, each filled by a slip of its text", () => {
    expect(startRestoring(won)).toEqual({
      filled: [1, 0, 2],
      restored: [true, true, true],
      returned: null,
    })
  })
})

describe("onPraxisBar: take", () => {
  it("fills the first empty gap, in the poem's order, with the slip taken", () => {
    expect(played(take(2)).filled).toEqual([2, null, null])
    expect(played(take(2), take(0)).filled).toEqual([2, 0, null])
  })

  it("fills the gap a tap emptied, when it is the first empty one", () => {
    expect(played(take(2), take(0), take(1), empty(0), take(2)).filled).toEqual([2, 0, 1])
    expect(played(take(2), take(0), empty(0)).filled).toEqual([null, 0, null])
  })

  it("changes nothing for a slip in a gap already, or one that is not there", () => {
    const state = played(take(2))
    expect(onPraxisBar(game, state, take(2)).state).toBe(state)
    expect(onPraxisBar(game, state, take(3)).state).toBe(state)
    expect(onPraxisBar(game, state, take(-1)).state).toBe(state)
  })

  it("changes nothing once every gap is filled", () => {
    const state = played(take(0), take(1), take(2))
    expect(onPraxisBar(game, state, take(0)).state).toBe(state)
  })
})

describe("onViewer: a filled gap tapped", () => {
  it("gives its slip back, emptying the gap", () => {
    expect(played(take(2), take(0), empty(1)).filled).toEqual([2, null, null])
  })

  it("changes nothing for an empty gap, a restored one, or one that is not there", () => {
    const state = played(take(2))
    expect(onViewer(state, empty(1))).toBe(state)
    expect(onViewer(state, empty(5))).toBe(state)
    const restored = startRestoring(won)
    expect(onViewer(restored, empty(0))).toBe(restored)
  })
})

describe("onPraxisBar: check", () => {
  it("changes nothing while a gap is empty", () => {
    const state = played(take(0), take(1))
    expect(onPraxisBar(game, state, check)).toEqual({ state, effects: [] })
  })

  it("restores each gap whose slip has its text, and gives back every other, emptying its gap", () => {
    // "Bird" in the first gap and a "the" in the second: both wrong; a "the" in the third: right
    const answer = onPraxisBar(game, played(take(0), take(1), take(2)), check)
    expect(answer.state).toEqual({
      filled: [null, null, 2],
      restored: [false, false, true],
      returned: 2,
    })
    expect(answer.effects).toEqual([])
  })

  it("takes slips with the same text as fitting each other's gaps", () => {
    const answer = onPraxisBar(game, played(take(2), take(0), take(1)), check)
    expect(answer.state.restored).toEqual([true, true, true])
  })

  it("sends out that the step is restored when it gives nothing back, and only then", () => {
    const answer = onPraxisBar(game, played(take(1), take(0), take(2)), check)
    expect(answer.state).toEqual({ filled: [1, 0, 2], restored: [true, true, true], returned: 0 })
    expect(answer.effects).toEqual([{ kind: "restored" }])
  })

  it("plays on after a check: the gaps given back fill first, and the restored ones are kept", () => {
    let state = onPraxisBar(game, played(take(0), take(1), take(2)), check).state
    state = onPraxisBar(game, state, take(1)).state
    state = onPraxisBar(game, state, take(0)).state
    expect(state.filled).toEqual([1, 0, 2])
    const answer = onPraxisBar(game, state, check)
    expect(answer.state.restored).toEqual([true, true, true])
    expect(answer.effects).toEqual([{ kind: "restored" }])
  })

  it("keeps how many it gave back only until the reader moves a slip again", () => {
    const checked = onPraxisBar(game, played(take(0), take(1), take(2)), check).state
    expect(checked.returned).toBe(2)
    expect(onPraxisBar(game, checked, take(0)).state.returned).toBeNull()
    expect(onViewer(onPraxisBar(game, checked, take(0)).state, empty(0)).returned).toBeNull()
  })

  it("changes nothing, and sends nothing out, once every gap is restored", () => {
    const state = startRestoring(won)
    expect(onPraxisBar(won, state, check)).toEqual({ state, effects: [] })
    expect(onPraxisBar(won, state, take(0)).state).toBe(state)
  })
})

describe("keepRestoring: the game, when the frame has a fresh subject for the step", () => {
  it("keeps the game as the reader has it while nothing about it has changed", () => {
    const state = played(take(2), take(0))
    expect(keepRestoring(game, { ...game }, state)).toBe(state)
  })

  it("restores every gap once the step is restored, here or in another tab", () => {
    const state = played(take(2))
    expect(keepRestoring(game, won, state)).toEqual(startRestoring(won))
    const whole = onPraxisBar(game, played(take(1), take(0), take(2)), check).state
    expect(keepRestoring(game, won, whole)).toBe(whole)
  })

  it("starts afresh when the step is no longer restored, or its gaps are others", () => {
    expect(keepRestoring(won, game, startRestoring(won))).toEqual(startRestoring(game))
    const fewer = { ...game, gaps: game.gaps.slice(0, 2), slips: ["Bird", "the"] }
    expect(keepRestoring(game, fewer, played(take(0)))).toEqual(startRestoring(fewer))
  })
})

describe("gapsOf: the gaps, for the viewer", () => {
  it("never gives an empty gap's text, gives a filled one the slip's, a restored one the poem's", () => {
    const state = onPraxisBar(game, played(take(0), take(1), take(2)), check).state
    const refilled = onPraxisBar(game, state, take(0)).state
    expect(gapsOf(game, refilled)).toEqual({
      of: "words",
      next: 1,
      gaps: [
        { state: "filled", span: span(0, 3), text: "Bird" },
        { state: "empty", span: span(4, 8) },
        { state: "restored", span: span(9, 12), text: "the" },
      ],
    })
  })

  it("has no next gap when every gap is filled", () => {
    expect(gapsOf(game, played(take(0), take(1), take(2))).next).toBeNull()
  })
})

describe("trayOf: the slips, for the praxis bar", () => {
  it("lists every slip in its place, whether it is in a gap, and whether Check may be pressed", () => {
    expect(trayOf(game, played(take(2)))).toEqual({
      of: "words",
      slips: [
        { text: "Bird", placed: false, restored: false },
        { text: "the", placed: false, restored: false },
        { text: "the", placed: true, restored: false },
      ],
      canCheck: false,
      restored: 0,
      gaps: 3,
      returned: null,
      whole: false,
    })
    expect(trayOf(game, played(take(0), take(1), take(2))).canCheck).toBe(true)
  })

  it("says which slips are matched: those in a restored gap", () => {
    const checked = onPraxisBar(game, played(take(0), take(1), take(2)), check).state
    expect(trayOf(game, checked).slips).toEqual([
      { text: "Bird", placed: false, restored: false },
      { text: "the", placed: false, restored: false },
      { text: "the", placed: true, restored: true },
    ])
  })

  it("counts the gaps restored and the slips given back, and says when the poem is whole", () => {
    const checked = onPraxisBar(game, played(take(0), take(1), take(2)), check).state
    expect(trayOf(game, checked)).toMatchObject({ restored: 1, returned: 2, whole: false })
    expect(trayOf(won, startRestoring(won))).toMatchObject({
      restored: 3,
      canCheck: false,
      whole: true,
    })
  })
})
