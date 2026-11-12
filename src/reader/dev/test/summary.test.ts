import { describe, expect, it } from "vitest"
import type { Practice, Step } from "../../../practice/types"
import { clockText, DAY, eventsText, fullWhere, notesText, shortWhere } from "../summary"
import type { Standing } from "../../../runner/types"

/** Where a screening stands: at a position, with when the next stage opens and where it holds. */
const standing = (
  stage: number,
  step: number,
  opensOn: string | null = null,
  heldAt: number | null = null,
): Standing => ({ position: { stage, step }, opensOn, heldAt })

const consider = (ref: string): Step => ({ direction: "consider", note: ref, prose: [] })

/** Two stages: two steps, then one. The rests are at step 2 and step 1. */
const practice: Practice = {
  id: "test",
  title: "Test",
  text: "poem",
  stages: [
    { name: "The meal", steps: [consider("@a"), consider("@b")] },
    { name: "The flight", steps: [consider("@c")] },
  ],
}

describe("shortWhere", () => {
  it("names the stage and step, counting from 1", () => {
    expect(shortWhere(practice, standing(0, 1).position)).toBe("stage 1 of 2, step 2 of 2")
    expect(shortWhere(practice, standing(1, 0).position)).toBe("stage 2 of 2, step 1 of 1")
  })

  it("names the rest and the final stage, which no editor wrote", () => {
    expect(shortWhere(practice, standing(0, 2, "2026-11-13").position)).toBe(
      "stage 1 of 2, the rest",
    )
    expect(shortWhere(practice, standing(2, 0).position)).toBe("the final stage")
  })
})

describe("fullWhere", () => {
  it("adds the stage's name", () => {
    expect(fullWhere(practice, standing(0, 0))).toBe('stage 1 of 2, "The meal": step 1 of 2')
  })

  it("says which step holds the reader until they have written", () => {
    expect(fullWhere(practice, standing(0, 0, null, 1))).toBe(
      'stage 1 of 2, "The meal": step 1 of 2, held at step 2 until written',
    )
  })

  it("at the rest, says when the next stage opens, if it knows", () => {
    expect(fullWhere(practice, standing(0, 2, "2026-11-13"))).toBe(
      'stage 1 of 2, "The meal": the rest, the next stage opens 2026-11-13',
    )
    expect(fullWhere(practice, standing(0, 2))).toBe('stage 1 of 2, "The meal": the rest')
  })

  it("names the final stage", () => {
    expect(fullWhere(practice, standing(2, 0))).toBe("the final stage")
  })
})

describe("clockText", () => {
  it("is only the day when the clock is the real time", () => {
    expect(clockText("2026-11-12", 0)).toBe("2026-11-12")
  })

  it("says how many days ahead the clock is", () => {
    expect(clockText("2026-11-13", DAY)).toBe("2026-11-13 (clock +1 day)")
    expect(clockText("2026-11-14", 2 * DAY)).toBe("2026-11-14 (clock +2 days)")
  })

  it("says hours when the clock is not a whole number of days ahead", () => {
    expect(clockText("2026-11-13", DAY + 60 * 60 * 1000)).toBe("2026-11-13 (clock +25 hours)")
  })
})

describe("eventsText", () => {
  it("counts the log's events", () => {
    expect(eventsText(0)).toBe("no events")
    expect(eventsText(1)).toBe("1 event")
    expect(eventsText(5)).toBe("5 events")
  })
})

describe("notesText", () => {
  it("counts the notebook's notes", () => {
    expect(notesText(0)).toBe("no notes")
    expect(notesText(1)).toBe("1 note")
    expect(notesText(3)).toBe("3 notes")
  })
})
