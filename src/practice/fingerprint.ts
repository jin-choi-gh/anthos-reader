import { hashOf } from "../material/fingerprint"
import type { Practice, PracticeFingerprint } from "./types"

/** A practice's fingerprint, its version: the hash of its stages' steps, in order, each written out
 * with its keys sorted, so that the order the source happens to write them in changes nothing. Only
 * the steps count: what the reader is asked and shown. The practice's title and its stages' names,
 * which are headings, do not, so renaming them makes no new version. */
export function fingerprintOfPractice(practice: Practice): PracticeFingerprint {
  const steps = practice.stages.map((stage) => stage.steps)
  return hashOf(canonical(steps)) as PracticeFingerprint
}

/** A value as JSON, with every object's keys in sorted order. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`
  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    return `{${entries.map(([key, inner]) => `${JSON.stringify(key)}:${canonical(inner)}`).join(",")}}`
  }
  return JSON.stringify(value)
}
