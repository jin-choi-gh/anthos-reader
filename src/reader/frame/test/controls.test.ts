import { describe, expect, it, vi } from "vitest"
import type { Position, Practice, Step } from "../../../practice/types"
import { controlsOf, reasonText } from "../controls"
import { annotateFrame, frameOf } from "../frame"

const consider = (ref: string): Step => ({ direction: "consider", note: ref, prose: [] })

/** Two stages of two steps each: the rests are at step 2. */
const practice: Practice = {
  id: "test",
  title: "Test",
  text: "poem",
  stages: [
    { name: "First", steps: [consider("@a"), consider("@b")] },
    { name: "Second", steps: [consider("@a"), consider("@b")] },
  ],
}

const today = "2026-11-11"

/** The controls at a position, and the moves their buttons asked for so far. */
function at(position: Position) {
  const moveTo = vi.fn<(step: number) => void>()
  return { controls: controlsOf(frameOf(practice, position, []), moveTo, today), moveTo }
}

/** Presses a control, which must be one that goes. */
function press(control: ReturnType<typeof at>["controls"]["back"]) {
  if (control.kind !== "go") throw new Error(`expected a button that goes, not ${control.kind}`)
  control.go()
}

describe("controlsOf: the frame's buttons", () => {
  it("on a stage's first step: Back refused, saying nothing; Next goes to the next step", () => {
    const { controls, moveTo } = at({ stage: 1, step: 0, opensOn: null })
    expect(controls.heading).toBe("Second")
    expect(controls.back).toEqual({ kind: "refused", why: null })
    press(controls.next)
    expect(moveTo).toHaveBeenCalledExactlyOnceWith(1)
  })

  it("on the last step: Back goes to the step before, Next to the rest", () => {
    const { controls, moveTo } = at({ stage: 0, step: 1, opensOn: null })
    press(controls.back)
    press(controls.next)
    expect(moveTo.mock.calls).toEqual([[0], [2]])
  })

  it("moves nothing until a button is pressed", () => {
    const { moveTo } = at({ stage: 0, step: 1, opensOn: null })
    expect(moveTo).not.toHaveBeenCalled()
  })

  it("at the rest, waiting: Back goes, and Next is refused with the day the next stage opens", () => {
    const { controls, moveTo } = at({ stage: 0, step: 2, opensOn: "2026-11-12" })
    expect(controls.next).toEqual({ kind: "refused", why: "The next stage opens tomorrow." })
    press(controls.back)
    expect(moveTo).toHaveBeenCalledExactlyOnceWith(1)
  })

  it("in the final stage: the practice's title, and no buttons at all", () => {
    const { controls } = at({ stage: 2, step: 0, opensOn: null })
    expect(controls).toEqual({ heading: "Test", back: { kind: "none" }, next: { kind: "none" } })
  })

  it("in annotate mode, with no runner: no heading and no buttons", () => {
    const controls = controlsOf(annotateFrame("poem", []), () => {}, today)
    expect(controls).toEqual({ heading: null, back: { kind: "none" }, next: { kind: "none" } })
  })
})

describe("reasonText", () => {
  it("says the next stage opens tomorrow, when it opens the day after today", () => {
    expect(reasonText({ kind: "waiting", opensOn: "2026-11-12" }, today)).toBe(
      "The next stage opens tomorrow.",
    )
    expect(reasonText({ kind: "waiting", opensOn: "2027-01-01" }, "2026-12-31")).toBe(
      "The next stage opens tomorrow.",
    )
  })

  it("names the day when it is further off, across months and years", () => {
    expect(reasonText({ kind: "waiting", opensOn: "2026-11-14" }, today)).toBe(
      "The next stage opens on 14 November.",
    )
    expect(reasonText({ kind: "waiting", opensOn: "2027-01-01" }, today)).toBe(
      "The next stage opens on 1 January.",
    )
  })

  it("says only that the next stage isn't open, when there is no day", () => {
    expect(reasonText({ kind: "waiting", opensOn: null }, today)).toBe(
      "The next stage isn't open yet.",
    )
  })

  it("says nothing for a step that isn't there, or a practice that is finished", () => {
    expect(reasonText({ kind: "noSuchStep" }, today)).toBeNull()
    expect(reasonText({ kind: "finished" }, today)).toBeNull()
  })
})
