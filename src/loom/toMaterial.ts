import { fingerprintOf } from "../material/fingerprint"
import type { Material } from "../material/materials"
import { notesFor } from "../material/notes"
import { spanProblem } from "../material/spans"
import type { Annotation } from "../material/types"
import { spanOf, substrateOf } from "./textualComplex"
import { toPoem } from "./toPoem"
import type { LoomTextualComplex } from "./types"

/** A text's material, from its textual complex. Throws when the poem has no text, or when one of the
 * editor's targets breaks loom's rule for spans, naming the note by its id or its number. */
export function toMaterial(textualComplex: LoomTextualComplex): Material {
  const substrate = substrateOf(textualComplex)
  if (substrate.lines.every((line) => line === "")) {
    throw new Error(`${textualComplex.name}: the poem has no text`)
  }
  const annotations = toAnnotations(textualComplex)
  for (const [index, annotation] of annotations.entries()) {
    for (const target of annotation.targets) {
      const problem = spanProblem(substrate, target)
      if (problem === null) continue
      const which = annotation.id ?? `number ${index + 1}`
      throw new Error(`${textualComplex.name}: the editor's note ${which}: ${problem}`)
    }
  }
  return {
    substrate,
    fingerprint: fingerprintOf(substrate),
    poem: toPoem(textualComplex),
    notes: notesFor(substrate, annotations),
  }
}

/** The editor's annotations: every annotation of every set, in file order. A file written before ids
 * or tags gives each a null id and no tags. */
export function toAnnotations(textualComplex: LoomTextualComplex): Annotation[] {
  return Object.values(textualComplex.annotations)
    .flat()
    .map((annotation) => ({
      id: annotation.id ?? null,
      targets: annotation.targets.map(spanOf),
      tags: annotation.tags ?? [],
      body: annotation.body,
    }))
}
