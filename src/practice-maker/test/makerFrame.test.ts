import { describe, expect, it } from "vitest"
import type { Material } from "../../material/materials"
import { spansOfNotehead } from "../../material/noteheads"
import type { Fingerprint } from "../../material/types"
import { REST } from "../../practice/parts"
import type { Practice } from "../../practice/types"
import { scene } from "../../reader/scenes/scene"
import { makerFrame, noteOf } from "../makerFrame"

const material: Material = {
  substrate: {
    lines: [
      { id: "l1", text: "A Bird, came down the Walk -" },
      { id: "l2", text: "He bit an Angle Worm in halves" },
    ],
  },
  fingerprint: "f" as Fingerprint,
  poem: { title: "Fixture", author: "", stanzas: [] },
}

const draft: Practice = {
  id: "draft",
  title: "Draft",
  text: "fixture",
  stages: [
    {
      name: "One",
      steps: [
        {
          ...REST,
          prose: ["Look at the worm."],
          highlight: [{ id: "worm", notehead: "l2 Worm", tags: ["gloss"], body: "The worm." }],
        },
        { ...REST, writing: { target: "whole", tags: [], count: "one" } },
      ],
    },
  ],
}

describe("makerFrame: the subject of the step being made", () => {
  it("shows the step's prose and its editor's notes, picked out, with a noting and no writing", () => {
    const subject = makerFrame(draft, { stage: 0, step: 0 }, material)!
    expect(subject).toMatchObject({
      key: "form/0/0",
      text: "fixture",
      prose: ["Look at the worm."],
      writing: null,
      noting: { substrate: material.substrate, tags: [] },
    })
    expect(subject.commentary).toMatchObject({ shown: "marked", written: null, recalled: null })
    expect(subject.commentary.notes).toEqual([
      {
        index: 0,
        id: "worm",
        lemma: [{ kind: "quote", text: "Worm" }],
        tags: ["gloss"],
        paragraphs: ["The worm."],
      },
    ])
    expect(subject.commentary.notes).toBe(subject.commentary.set.notes)
  })

  it("leaves out a writing the step asks of the reader: the editor writes notes, not answers", () => {
    expect(makerFrame(draft, { stage: 0, step: 1 }, material)?.writing).toBeNull()
  })

  it("is keyed by the step's place, so another step starts the scene afresh", () => {
    expect(makerFrame(draft, { stage: 0, step: 1 }, material)?.key).toBe("form/0/1")
  })

  it("is none for a step the draft does not have", () => {
    expect(makerFrame(draft, { stage: 0, step: 2 }, material)).toBeNull()
    expect(makerFrame(draft, { stage: 1, step: 0 }, material)).toBeNull()
  })
})

describe("noteOf: a noting's new note as an editor's note", () => {
  it("writes its targets as a notehead that places them again, with the id given", () => {
    const worm = { start: { line: 1, offset: 10 }, end: { line: 1, offset: 20 } }
    const effect = { kind: "note", targets: [worm], tags: [], body: "Angle worm." } as const
    const note = noteOf(effect, material.substrate, "note-1")
    expect(note).toEqual({ id: "note-1", notehead: "l2 Angle Worm", tags: [], body: "Angle worm." })
    expect(spansOfNotehead(material.substrate, note!.notehead)).toEqual({ spans: [worm] })
  })

  it("is none for targets no notehead can write", () => {
    const point = { start: { line: 0, offset: 2 }, end: { line: 0, offset: 2 } }
    expect(
      noteOf({ kind: "note", targets: [point], tags: [], body: "x" }, material.substrate, "n"),
    ).toBeNull()
  })

  it("takes the note the Scene sends out when the editor adds one on chosen passages", () => {
    const subject = makerFrame(draft, { stage: 0, step: 0 }, material)!
    let state = scene.start(subject).state
    state = scene.fromPraxisBar(state, { kind: "choosing", on: true }).state
    const bird = { start: { line: 0, offset: 2 }, end: { line: 0, offset: 6 } }
    state = scene.fromViewer(state, { kind: "choose", span: bird }).state
    state = scene.fromPraxisBar(state, { kind: "noteDraft", text: "  The bird.  " }).state
    const [effect] = scene.fromPraxisBar(state, { kind: "addNote" }).effects
    expect(effect?.kind).toBe("note")
    if (effect?.kind !== "note") return
    expect(noteOf(effect, material.substrate, "note-1")).toEqual({
      id: "note-1",
      notehead: "l1 Bird",
      tags: [],
      body: "The bird.",
    })
  })
})
