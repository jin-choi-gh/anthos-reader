import { describe, expect, it, vi } from "vitest"
import type { Practice, Step } from "../../../practice/types"
import type { Position } from "../../../runner/types"
import { controlsOf } from "../controls"
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

/** The controls at a position, and the moves their buttons asked for so far. */
function at(position: Position) {
  const moveTo = vi.fn<(step: number) => void>()
  return { controls: controlsOf(frameOf(practice, position, []), moveTo), moveTo }
}

/** Presses a control, which must be one that goes. */
function press(control: ReturnType<typeof at>["controls"]["back"]) {
  if (control.kind !== "go") throw new Error(`expected a button that goes, not ${control.kind}`)
  control.go()
}

describe("controlsOf: the frame's buttons", () => {
  it("on a stage's first step: Back refused, as no such step; Next goes to the next step", () => {
    const { controls, moveTo } = at({ stage: 1, step: 0, opensOn: null })
    expect(controls.heading).toBe("Second")
    expect(controls.back).toEqual({ kind: "refused", reason: { kind: "noSuchStep" } })
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
    expect(controls.next).toEqual({
      kind: "refused",
      reason: { kind: "waiting", opensOn: "2026-11-12" },
    })
    press(controls.back)
    expect(moveTo).toHaveBeenCalledExactlyOnceWith(1)
  })

  it("in the final stage: the practice's title, and no buttons at all", () => {
    const { controls } = at({ stage: 2, step: 0, opensOn: null })
    expect(controls).toEqual({ heading: "Test", back: { kind: "none" }, next: { kind: "none" } })
  })

  it("in annotate mode, with no runner: no heading and no buttons", () => {
    const controls = controlsOf(annotateFrame("poem", []), () => {})
    expect(controls).toEqual({ heading: null, back: { kind: "none" }, next: { kind: "none" } })
  })
})
