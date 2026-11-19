import { describe, expect, it } from "vitest"
import type { Substrate } from "../../material/types"
import { REST } from "../../practice/parts"
import type { Practice } from "../../practice/types"
import {
  eventOfSaving,
  eventOfWithdrawing,
  isMadeEvent,
  madePracticesOf,
  type MadeEvent,
} from "../store"

const substrate: Substrate = { lines: [{ id: "l1", text: "He bit an Angle Worm in halves" }] }

const practice = (id: string, words = "Look.", text = "dickinson"): Practice => ({
  id,
  title: id,
  text,
  stages: [{ name: "One", steps: [{ ...REST, prose: [words] }] }],
})

const saved = (p: Practice, at = 0): MadeEvent => ({ kind: "saved", at, practice: p })
const withdrawn = (id: string, at = 0): MadeEvent => ({ kind: "withdrawn", at, id })

describe("madePracticesOf: the practices saved for a text, as they stand", () => {
  it("is none when nothing is saved", () => {
    expect(madePracticesOf("dickinson", [])).toEqual([])
  })

  it("keeps, for each id, the one last saved, in the order last saved", () => {
    const a1 = practice("a", "First.")
    const b = practice("b")
    const a2 = practice("a", "Second.")
    expect(madePracticesOf("dickinson", [saved(a1), saved(b), saved(a2)])).toEqual([b, a2])
  })

  it("leaves out one taken back, until it is saved again", () => {
    const a = practice("a")
    const b = practice("b")
    expect(madePracticesOf("dickinson", [saved(a), saved(b), withdrawn("a")])).toEqual([b])
    expect(madePracticesOf("dickinson", [saved(a), withdrawn("a"), saved(a)])).toEqual([a])
  })

  it("leaves out a practice saved for another text", () => {
    expect(madePracticesOf("dickinson", [saved(practice("a", "Look.", "herbert"))])).toEqual([])
  })
})

describe("eventOfSaving", () => {
  it("saves a practice with no problems, at the time given", () => {
    const p = practice("a")
    expect(eventOfSaving([], p, substrate, 42)).toEqual({ kind: "saved", at: 42, practice: p })
  })

  it("refuses a practice with problems on its text's lines", () => {
    const broken: Practice = { ...practice("a"), stages: [] }
    expect(() => eventOfSaving([], broken, substrate, 0)).toThrow(
      "a practice with problems is not saved: no stages",
    )
  })

  it("adds nothing for a practice saved just as it is", () => {
    const p = practice("a")
    expect(eventOfSaving([p], JSON.parse(JSON.stringify(p)), substrate, 1)).toBeNull()
  })

  it("saves a change to the title or a stage's name, which makes no new version", () => {
    const p = practice("a")
    expect(eventOfSaving([p], { ...p, title: "Renamed" }, substrate, 1)).not.toBeNull()
    const renamed = { ...p, stages: [{ ...p.stages[0]!, name: "Renamed" }] }
    expect(eventOfSaving([p], renamed, substrate, 1)).not.toBeNull()
  })
})

describe("eventOfWithdrawing", () => {
  it("takes back a saved practice, and does nothing for one not saved", () => {
    const p = practice("a")
    expect(eventOfWithdrawing([p], "a", 7)).toEqual({ kind: "withdrawn", at: 7, id: "a" })
    expect(eventOfWithdrawing([p], "b", 7)).toBeNull()
  })
})

describe("isMadeEvent: a value read from storage", () => {
  it("takes a saved practice and a withdrawal, as JSON gives them back", () => {
    for (const event of [saved(practice("a")), withdrawn("a")]) {
      expect(isMadeEvent(JSON.parse(JSON.stringify(event)))).toBe(true)
    }
  })

  it("refuses a saved practice that is not one, and a kind it does not know", () => {
    expect(isMadeEvent({ kind: "saved", at: 0, practice: { id: "a" } })).toBe(false)
    expect(isMadeEvent({ kind: "renamed", at: 0, id: "a" })).toBe(false)
    expect(isMadeEvent({ kind: "withdrawn", id: "a" })).toBe(false)
    expect(isMadeEvent(null)).toBe(false)
  })
})
