import { describe, expect, it } from "vitest"
import { final } from "../final"

const subject = { kind: "final", text: "poem" } as const
const silent = { toViewer: [], toPraxisBar: [] }

describe("final", () => {
  it("starts by keeping its subject, and says nothing to anyone", () => {
    expect(final.start(subject)).toEqual({ state: subject, ...silent })
    expect(final.start(subject).state).toBe(subject)
  })

  it("shows its text with nothing highlighted", () => {
    expect(final.viewer(subject)).toEqual({ kind: "marked", text: "poem", marked: [], open: null })
  })

  it("says in the praxis bar that the practice is done", () => {
    expect(final.praxisBar(subject)).toEqual({ kind: "prose", paragraphs: ["You have finished!"] })
  })

  it("gives back the very same state whatever the viewer says", () => {
    for (const message of [{ kind: "tapNote", note: 0 }, { kind: "closeNote" }] as const) {
      expect(final.fromViewer(subject, message)).toEqual({ state: subject, ...silent })
      expect(final.fromViewer(subject, message).state).toBe(subject)
    }
  })
})
