import type { Material } from "../material/materials"
import { problemsOf, wordedProblem } from "../practice/problems"
import type { Practice } from "../practice/types"
import type { ModeName } from "../route"

/** How a text is read now. In annotate mode, practice is the one to switch to, or null when the
 * text has none that can run. */
export type Mode =
  { name: "practice"; practice: Practice } | { name: "annotate"; practice: Practice | null }

/** The mode a text opens in: the one asked for, unless its practice is missing or has problems on
 * the text's lines and words, when it opens to annotate, and the problems, in words, say why; or
 * unless annotate is asked for while the reader is at a step that restores and is not restored
 * (`restoring`), which they may not leave: then it opens the practice. */
export function modeOf(
  asked: ModeName,
  practice: Practice | null,
  text: Pick<Material, "substrate" | "words">,
  restoring = false,
): { mode: Mode; problems: string[] } {
  const problems =
    practice === null
      ? []
      : problemsOf(practice, text).map((problem) => wordedProblem(practice, problem))
  const runnable = problems.length === 0 ? practice : null
  const mode: Mode =
    (asked === "practice" || restoring) && runnable !== null
      ? { name: "practice", practice: runnable }
      : { name: "annotate", practice: runnable }
  return { mode, problems }
}
