import { describe, expect, it } from "vitest"
import { reasonText } from "../reasonText"

const today = "2026-11-11"

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
