import { fingerprintOf } from "../material/fingerprint"
import type { Material } from "../material/materials"
import { substrateOf } from "./textualComplex"
import { toPoem } from "./toPoem"
import type { LoomTextualComplex } from "./types"

/** A text's material, from its textual complex: its lines, their fingerprint and the poem. loom's
 * annotations are not read: the editor's notes are written in the practice. Throws when the poem
 * has no text. */
export function toMaterial(textualComplex: LoomTextualComplex): Material {
  const substrate = substrateOf(textualComplex)
  if (substrate.lines.every((line) => line.text === "")) {
    throw new Error(`${textualComplex.name}: the poem has no text`)
  }
  return {
    substrate,
    fingerprint: fingerprintOf(substrate),
    poem: toPoem(textualComplex),
  }
}
