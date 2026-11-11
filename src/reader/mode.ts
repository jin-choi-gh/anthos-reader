import { problemsOf } from "../practice/notes"
import type { Practice } from "../practice/types"
import type { ModeName } from "../route"
import type { Note } from "./types"

/** How a text is read now. In annotate mode, practice is the one to switch to, or null when the
 * text has none that can run. */
export type Mode =
  { name: "practice"; practice: Practice } | { name: "annotate"; practice: Practice | null }

/** The mode a text opens in: the one asked for, unless its practice is missing or refers to notes
 * the text lacks. Then it opens to annotate, and the problems say why. */
export function modeOf(
  asked: ModeName,
  practice: Practice | null,
  notes: Note[],
): { mode: Mode; problems: string[] } {
  const problems = practice === null ? [] : problemsOf(practice, notes)
  const runnable = problems.length === 0 ? practice : null
  const mode: Mode =
    asked === "practice" && runnable !== null
      ? { name: "practice", practice: runnable }
      : { name: "annotate", practice: runnable }
  return { mode, problems }
}
