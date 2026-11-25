import { describe, expect, it } from "vitest"
import { practiceFor } from "../choose"
import type { Practice } from "../types"

const practice = (id: string, text: string): Practice => ({ id, title: id, text, stages: [] })

const files = [
  practice("first", "dickinson"),
  practice("second", "dickinson"),
  practice("sonnet", "shakespeare"),
]

describe("practiceFor: the practice a text runs", () => {
  it("is the first of its practice files, when none is saved for it", () => {
    expect(practiceFor("dickinson", files, [])).toBe(files[0])
    expect(practiceFor("shakespeare", files, [])).toBe(files[2])
  })

  it("is the one last saved for it in the browser, over its practice files", () => {
    const saved = [
      practice("made", "dickinson"),
      practice("other", "herbert"),
      practice("remade", "dickinson"),
    ]
    expect(practiceFor("dickinson", files, saved)).toBe(saved[2])
    expect(practiceFor("herbert", files, saved)).toBe(saved[1])
  })

  it("is none for a text with neither", () => {
    expect(practiceFor("vendler", files, [])).toBeNull()
  })
})
