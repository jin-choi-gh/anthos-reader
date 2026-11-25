import type { Substrate } from "../material/types"
import { problemsOf, wordedProblem } from "../practice/problems"
import type { Practice } from "../practice/types"
import type { ModeName } from "../route"

/** How a text is read now. In annotate mode, practice is the one to switch to, or null when the
 * text has none that can run. */
export type Mode =
  { name: "practice"; practice: Practice } | { name: "annotate"; practice: Practice | null }

/** The mode a text opens in: the one asked for, unless its practice is missing or has problems on
 * the text's lines. Then it opens to annotate, and the problems, in words, say why. */
export function modeOf(
  asked: ModeName,
  practice: Practice | null,
  substrate: Substrate,
): { mode: Mode; problems: string[] } {
  const problems =
    practice === null
      ? []
      : problemsOf(practice, substrate).map((problem) => wordedProblem(practice, problem))
  const runnable = problems.length === 0 ? practice : null
  const mode: Mode =
    asked === "practice" && runnable !== null
      ? { name: "practice", practice: runnable }
      : { name: "annotate", practice: runnable }
  return { mode, problems }
}
