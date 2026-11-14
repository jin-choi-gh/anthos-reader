import { codePoints } from "../../material/codePoints"
import type { Position } from "../../material/types"

/** The place in the poem under a point on the screen, between two characters: the line, from the
 * line's data-line, and the offset in code points, from the piece's data-start and the characters
 * before the point in it. Null when the point is not over a line's text, such as over a line number
 * or between stanzas. */
export function positionAt(x: number, y: number): Position | null {
  const caret = caretAt(x, y)
  if (caret === null || caret.node.nodeType !== Node.TEXT_NODE) return null
  const piece = caret.node.parentElement?.closest<HTMLElement>("[data-start]")
  const line = piece?.closest<HTMLElement>("[data-line]")
  if (piece == null || line == null) return null
  const before = (caret.node.textContent ?? "").slice(0, caret.offset)
  return {
    line: Number(line.dataset.line),
    offset: Number(piece.dataset.start) + codePoints(before).length,
  }
}

/** The text and the place in it under a point, by the browser's own reckoning: the standard way,
 * or the way older Safari has. */
function caretAt(x: number, y: number): { node: Node; offset: number } | null {
  if (typeof document.caretPositionFromPoint === "function") {
    const caret = document.caretPositionFromPoint(x, y)
    return caret === null ? null : { node: caret.offsetNode, offset: caret.offset }
  }
  const range = document.caretRangeFromPoint?.(x, y)
  return range == null ? null : { node: range.startContainer, offset: range.startOffset }
}
