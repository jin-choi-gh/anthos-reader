import { describe, expect, it } from "vitest"
import { rest } from "../rest"

const subject = { kind: "rest", text: "poem" } as const
const silent = { toViewer: [], toPraxisBar: [] }

describe("rest", () => {
  it("starts by keeping its subject, and says nothing to anyone", () => {
    expect(rest.start(subject)).toEqual({ state: subject, ...silent })
    expect(rest.start(subject).state).toBe(subject)
  })

  it("shows its text with nothing highlighted", () => {
    expect(rest.viewer(subject)).toEqual({ kind: "marked", text: "poem", marked: [], open: null })
  })

  it("leaves the praxis bar to the frame: nothing of its own there", () => {
    expect(rest.praxisBar(subject)).toBeNull()
  })

  it("gives back the very same state whatever the viewer says", () => {
    for (const message of [{ kind: "tapNote", note: 0 }, { kind: "closeNote" }] as const) {
      expect(rest.fromViewer(subject, message)).toEqual({ state: subject, ...silent })
      expect(rest.fromViewer(subject, message).state).toBe(subject)
    }
  })
})
