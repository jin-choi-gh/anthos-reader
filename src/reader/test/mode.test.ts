import { describe, expect, it } from "vitest"
import type { Practice } from "../../practice/types"
import { modeOf } from "../mode"
import type { Note } from "../types"

/** A note as toNotes makes one, with only what these tests look at. */
const note = (index: number, loomId: string | null): Note => ({
  index,
  loomId,
  lemma: [],
  tags: [],
  paragraphs: [],
})

const notes = [note(0, "angle-worm"), note(1, "beads")]

const practiceOn = (...refs: string[]): Practice => ({
  id: "test",
  title: "Test",
  text: "dickinson",
  stages: [
    { name: "The meal", steps: refs.map((ref) => ({ verb: "consider", note: ref, prose: [] })) },
  ],
})

const resolves = practiceOn("@angle-worm", "@beads")
const broken = practiceOn("@angle-worm", "@flight", "beads")
const brokenProblems = [
  'stage 1 "The meal", step 2: no note @flight in dickinson',
  'stage 1 "The meal", step 3: beads is not a note reference; write @ and the note\'s id',
]

describe("modeOf, when practice is asked for", () => {
  it("runs a practice whose notes are all there", () => {
    expect(modeOf("practice", resolves, notes)).toEqual({
      mode: { name: "practice", practice: resolves },
      problems: [],
    })
  })

  it("annotates a text that has no practice, with nothing to switch to", () => {
    expect(modeOf("practice", null, notes)).toEqual({
      mode: { name: "annotate", practice: null },
      problems: [],
    })
  })

  it("annotates a text whose practice is broken, as if it had none, and says why", () => {
    expect(modeOf("practice", broken, notes)).toEqual({
      mode: { name: "annotate", practice: null },
      problems: brokenProblems,
    })
  })
})

describe("modeOf, when annotate is asked for", () => {
  it("annotates, offering the practice to switch to", () => {
    expect(modeOf("annotate", resolves, notes)).toEqual({
      mode: { name: "annotate", practice: resolves },
      problems: [],
    })
  })

  it("annotates a text that has no practice, with nothing to switch to", () => {
    expect(modeOf("annotate", null, notes)).toEqual({
      mode: { name: "annotate", practice: null },
      problems: [],
    })
  })

  it("annotates a text whose practice is broken, offering nothing, and still says why", () => {
    expect(modeOf("annotate", broken, notes)).toEqual({
      mode: { name: "annotate", practice: null },
      problems: brokenProblems,
    })
  })
})

it("hands back the practice it was given, not a copy", () => {
  const { mode } = modeOf("practice", resolves, notes)
  expect(mode.practice).toBe(resolves)
})
