import type { TextId } from "../material/types"
import type { Practice } from "./types"

/** The practice a text runs: the one last saved for it in the browser, or else the first of its
 * practice files, in the order given; or null, when it has neither, and the text then opens in
 * annotate mode. `saved` is in the order saved. */
export function practiceFor(
  text: TextId,
  files: readonly Practice[],
  saved: readonly Practice[],
): Practice | null {
  const own = (practice: Practice) => practice.text === text
  return saved.findLast(own) ?? files.find(own) ?? null
}
