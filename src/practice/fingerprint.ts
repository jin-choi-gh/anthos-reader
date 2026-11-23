import { hashOf } from "../material/fingerprint"
import type { Practice, PracticeFingerprint } from "./types"

/** A practice's fingerprint, its version: the hash of its stages' steps, in order, each written out
 * with its keys sorted, so that the order the source happens to write them in changes nothing. Only
 * the steps count, their ids included: what the reader is asked and shown. The practice's title and
 * its stages' names, which are headings, and its stages' ids and days do not, so renaming a stage,
 * or changing when it opens, makes no new version and no new run. */
export function fingerprintOfPractice(practice: Practice): PracticeFingerprint {
  const steps = practice.stages.map((stage) => stage.steps)
  return hashOf(canonical(steps)) as PracticeFingerprint
}

/** Whether two practices are the same, whole: their ids, titles and texts, and their stages, with
 * their names and days, as well as their steps. Two practices with the same fingerprint may differ
 * here, in what the fingerprint leaves out. */
export function samePractice(a: Practice, b: Practice): boolean {
  return canonical(a) === canonical(b)
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
