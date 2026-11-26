import { describe, expect, it } from "vitest"
import type { Substrate } from "../../material/types"
import { REST } from "../../practice/parts"
import { practiceOf } from "../../practice/test/build"
import type { EditorsNote, Practice } from "../../practice/types"
import { modeOf } from "../mode"

const substrate: Substrate = {
  lines: [
    { id: "l1", text: "He bit an Angle Worm in halves" },
    { id: "l2", text: "And ate the fellow, raw," },
  ],
}
const text = { substrate, words: [] }

const note = (id: string, notehead: string): EditorsNote => ({
  id,
  notehead,
  tags: [],
  body: "A note.",
})

/** A practice of one stage, a step for each editor's note. */
const practiceOn = (...notes: EditorsNote[]): Practice =>
  practiceOf({
    id: "test",
    title: "Test",
    text: "dickinson",
    stages: [
      { name: "The meal", steps: notes.map((n) => ({ ...REST, prose: ["See."], highlight: [n] })) },
    ],
  })

const runs = practiceOn(note("angle-worm", "l1 Angle Worm"), note("fellow", "l2 fellow"))
const broken = practiceOn(note("angle-worm", "l1 Angle Worm"), note("flight", "l2 flight"))
const brokenProblems = [
  'stage 1 "The meal", step 2, note 1: l2 "flight": "flight" is not in line l2: "And ate the fellow, raw,"',
]

describe("modeOf, when practice is asked for", () => {
  it("runs a practice with no problems on the text's lines", () => {
    expect(modeOf("practice", runs, text)).toEqual({
      mode: { name: "practice", practice: runs },
      problems: [],
    })
  })

  it("annotates a text that has no practice, with nothing to switch to", () => {
    expect(modeOf("practice", null, text)).toEqual({
      mode: { name: "annotate", practice: null },
      problems: [],
    })
  })

  it("annotates a text whose practice has problems, as if it had none, and says why", () => {
    expect(modeOf("practice", broken, text)).toEqual({
      mode: { name: "annotate", practice: null },
      problems: brokenProblems,
    })
  })
})

describe("modeOf, when annotate is asked for", () => {
  it("annotates, offering the practice to switch to", () => {
    expect(modeOf("annotate", runs, text)).toEqual({
      mode: { name: "annotate", practice: runs },
      problems: [],
    })
  })

  it("annotates a text that has no practice, with nothing to switch to", () => {
    expect(modeOf("annotate", null, text)).toEqual({
      mode: { name: "annotate", practice: null },
      problems: [],
    })
  })

  it("annotates a text whose practice has problems, offering nothing, and still says why", () => {
    expect(modeOf("annotate", broken, text)).toEqual({
      mode: { name: "annotate", practice: null },
      problems: brokenProblems,
    })
  })
})

it("hands back the practice it was given, not a copy", () => {
  const { mode } = modeOf("practice", runs, text)
  expect(mode.practice).toBe(runs)
})

describe("modeOf, at a step that restores and is not restored", () => {
  it("opens the practice when annotate is asked for, since the reader may not leave the step", () => {
    expect(modeOf("annotate", runs, text, true)).toEqual({
      mode: { name: "practice", practice: runs },
      problems: [],
    })
  })

  it("opens the practice when it is asked for, as always", () => {
    expect(modeOf("practice", runs, text, true).mode.name).toBe("practice")
  })

  it("still annotates when the practice cannot run, as there is no step to be held at", () => {
    expect(modeOf("annotate", broken, text, true).mode).toEqual({
      name: "annotate",
      practice: null,
    })
    expect(modeOf("annotate", null, text, true).mode).toEqual({ name: "annotate", practice: null })
  })
})
