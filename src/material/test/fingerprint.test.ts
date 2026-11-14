import { describe, expect, it } from "vitest"
import { fingerprintOf } from "../fingerprint"

const lines = ["A Bird, came down the Walk -", "He did not know I saw -"]

describe("fingerprintOf", () => {
  it("gives the same lines the same fingerprint, as 14 hex digits", () => {
    expect(fingerprintOf({ lines })).toBe(fingerprintOf({ lines: [...lines] }))
    expect(fingerprintOf({ lines })).toMatch(/^[0-9a-f]{14}$/)
  })

  it("gives other lines another fingerprint", () => {
    const changed = ["A Bird, came down the Walk –", "He did not know I saw -"]
    expect(fingerprintOf({ lines: changed })).not.toBe(fingerprintOf({ lines }))
    expect(fingerprintOf({ lines: [lines.join(" ")] })).not.toBe(fingerprintOf({ lines }))
    expect(fingerprintOf({ lines: [...lines, ""] })).not.toBe(fingerprintOf({ lines }))
  })
})
