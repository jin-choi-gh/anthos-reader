import { describe, expect, it } from "vitest"
import { fingerprintOf } from "../../material/fingerprint"
import { makeTextualComplex } from "./fixture"
import { toAnnotations, toMaterial } from "../toMaterial"
import type { LoomSpan } from "../types"

const stanzas = [
  ["A Bird, came down the Walk -", "He did not know I saw -", "He bit an Angle Worm in halves"],
]
const target = { start: [2, 10], end: [2, 15] } as const satisfies LoomSpan

describe("toAnnotations: the editor's annotations", () => {
  it("takes every annotation of every set, in file order", () => {
    const complex = makeTextualComplex(stanzas, {
      annotations: [
        { targets: [target], body: "A note." },
        { targets: [target], body: "Another." },
      ],
    })
    complex.annotations["notes-fear"] = [{ targets: [target], body: "In another set." }]
    expect(toAnnotations(complex).map((annotation) => annotation.body)).toEqual([
      "A note.",
      "Another.",
      "In another set.",
    ])
  })

  it("keeps an id, and gives null to an annotation without one", () => {
    const complex = makeTextualComplex(stanzas, {
      annotations: [
        { id: "angle-worm", targets: [target], body: "Named." },
        { id: null, targets: [target], body: "Unnamed." },
        { targets: [target], body: "From a file written before ids." },
      ],
    })
    expect(toAnnotations(complex).map((annotation) => annotation.id)).toEqual([
      "angle-worm",
      null,
      null,
    ])
  })

  it("keeps tags, and gives none to an annotation from a file written before tags", () => {
    const complex = makeTextualComplex(stanzas, {
      annotations: [
        { targets: [target], tags: ["gloss", "comment"], body: "A note." },
        { targets: [target], body: "A note." },
      ],
    })
    expect(toAnnotations(complex).map((annotation) => annotation.tags)).toEqual([
      ["gloss", "comment"],
      [],
    ])
  })

  it("gives each target as a span of positions", () => {
    const complex = makeTextualComplex(stanzas, { annotations: [{ targets: [target], body: "x" }] })
    expect(toAnnotations(complex)[0]!.targets).toEqual([
      { start: { line: 2, offset: 10 }, end: { line: 2, offset: 15 } },
    ])
  })
})

describe("toMaterial", () => {
  it("builds the substrate, its fingerprint, the poem and the editor's notes together", () => {
    const complex = makeTextualComplex(stanzas, {
      annotations: [{ id: "angle-worm", targets: [target], body: "A note." }],
    })
    const material = toMaterial(complex)
    expect(material.substrate).toEqual({ lines: stanzas[0] })
    expect(material.fingerprint).toBe(fingerprintOf({ lines: stanzas[0]! }))
    expect(material.poem.stanzas[0]!.lines.map((line) => line.text)).toEqual(stanzas[0])
    expect(material.notes.notes[0]).toMatchObject({
      loomId: "angle-worm",
      lemma: [{ kind: "quote", text: "Angle" }],
    })
  })

  it("refuses an editor's target that breaks loom's rule for spans, naming the note", () => {
    const complex = makeTextualComplex(stanzas, {
      annotations: [
        { targets: [target], body: "Fine." },
        { targets: [{ start: [0, 28], end: [1, 2] }], body: "Starts at a line's end." },
      ],
    })
    expect(() => toMaterial(complex)).toThrow(
      "fixture: the editor's note number 2: 1:29–2:3 starts at the end of a line",
    )
  })

  it("refuses a poem with no text", () => {
    expect(() => toMaterial(makeTextualComplex([["", ""]]))).toThrow(
      "fixture: the poem has no text",
    )
  })
})
