import type { TextId } from "../material/types"
import { samePractice } from "../practice/fingerprint"
import { REST } from "../practice/parts"
import type { Practice, PracticeId } from "../practice/types"

/** A new practice for a text, with the id given, which the hook makes: no title, and one stage
 * with one step, stage-1 and step-1, with no name and no prose, ready to be written. problemsOf
 * says what is missing until it is. */
export function newPractice(text: TextId, id: PracticeId): Practice {
  return {
    id,
    title: "",
    text,
    stages: [{ id: "stage-1", name: "", days: null, steps: [{ id: "step-1", ...REST }] }],
  }
}

/** Where a draft started from: the practice saved in the browser with its id and text, or else the
 * practice file with them, or nothing, for a new practice. */
export type Origin =
  { readonly from: "saved" | "file"; readonly practice: Practice } | { readonly from: "new" }

/** Where a draft started from, among the practice files and the practices saved for its text, in
 * the order saved: the last saved with its id wins over a file with it. */
export function originOf(
  draft: Practice,
  files: readonly Practice[],
  saved: readonly Practice[],
): Origin {
  const same = (practice: Practice) => practice.id === draft.id && practice.text === draft.text
  const kept = saved.findLast(same)
  if (kept !== undefined) return { from: "saved", practice: kept }
  const file = files.find(same)
  return file === undefined ? { from: "new" } : { from: "file", practice: file }
}

/** The draft to keep in the browser after a change: the draft, or null when it is back to just
 * what it started from, so that nothing is kept and nothing is unsaved. A new practice is always
 * kept. */
export function draftToKeep(draft: Practice, origin: Origin): Practice | null {
  return origin.from !== "new" && samePractice(draft, origin.practice) ? null : draft
}
