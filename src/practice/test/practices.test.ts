import { describe, expect, it } from "vitest"
import type { Note } from "../../material/types"
import { partsOf } from "../lexicon"
import { idOf, problemsOf } from "../references"
import { firstReading } from "../practices/firstReading"
import { PRACTICES, practiceFor } from "../practices"
import type { Practice } from "../types"

describe("practiceFor", () => {
  it("finds the practice performed on a text", () => {
    expect(practiceFor("dickinson")).toBe(firstReading)
  })

  it("finds none for a text without one", () => {
    expect(practiceFor("vendler")).toBeNull()
    expect(practiceFor("nope")).toBeNull()
  })
})

describe("the registered practices", () => {
  it("claim each text at most once", () => {
    const texts = PRACTICES.map((practice) => practice.text)
    expect(new Set(texts).size).toBe(texts.length)
  })

  it("have distinct ids", () => {
    const ids = PRACTICES.map((practice) => practice.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  // The texts are not in git, so whether each note exists is checked when the reader opens the
  // text. Here every well-formed reference is given a stand-in note, so what problemsOf still
  // finds is wrong with the practice itself: a malformed reference, an empty stage, no stages.
  it.each(PRACTICES.map((practice) => [practice.id, practice] as const))(
    "%s is well formed",
    (_, practice) => {
      expect(problemsOf(practice, standInNotes(practice))).toEqual([])
    },
  )
})

/** A note for every well-formed reference a practice makes. */
function standInNotes(practice: Practice): Note[] {
  const ids = practice.stages.flatMap((stage) =>
    stage.steps.flatMap((step) => partsOf(step).highlight.map(idOf)),
  )
  return ids
    .filter((id) => id !== null)
    .map((id, index) => ({ index, id, lemma: [], tags: [], paragraphs: [] }))
}
