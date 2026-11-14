import { codePoints } from "./codePoints"
import type { Position, Span, Substrate } from "./types"

/** A line's length, in code points. Throws for a line the substrate does not have. */
export function lineLength(substrate: Substrate, line: number): number {
  return codePoints(lineAt(substrate, line)).length
}

/** The text a span covers, as loom's Substrate.text_of gives it: across lines, each line's part,
 * joined by line breaks. Throws for a line the substrate does not have. */
export function textOf(substrate: Substrate, span: Span): string {
  const { start, end } = span
  const line = (index: number) => codePoints(lineAt(substrate, index))
  if (start.line === end.line) return line(start.line).slice(start.offset, end.offset).join("")
  const first = line(start.line).slice(start.offset).join("")
  const middle = substrate.lines.slice(start.line + 1, end.line)
  const last = line(end.line).slice(0, end.offset).join("")
  return [first, ...middle, last].join("\n")
}

/** What is wrong with a span on this substrate, by loom's rule, or null if nothing is. A span lies
 * in the poem, runs forwards, never starts at a line's end, and never ends at a line's start. A span
 * of no length (a point) inside a line breaks none of these. */
export function spanProblem(substrate: Substrate, span: Span): string | null {
  const { start, end } = span
  const outside = [start, end].find((position) => !isIn(substrate, position))
  if (outside !== undefined) return `${positionText(outside)} is not in the poem`
  const where = `${positionText(start)}–${positionText(end)}`
  if (end.line < start.line || (end.line === start.line && end.offset < start.offset))
    return `${where} runs backwards`
  if (start.offset === lineLength(substrate, start.line))
    return `${where} starts at the end of a line`
  if (end.offset === 0) return `${where} ends at the start of a line`
  return null
}

/** The span of the whole poem: from the start of its first line with text to the end of its last.
 * Lines with no text at either end lie outside it, as loom's rule asks. Throws when no line has
 * text. */
export function wholePoem(substrate: Substrate): Span {
  const first = substrate.lines.findIndex((line) => line !== "")
  const last = substrate.lines.findLastIndex((line) => line !== "")
  if (first < 0) throw new RangeError("the poem has no text")
  return {
    start: { line: first, offset: 0 },
    end: { line: last, offset: lineLength(substrate, last) },
  }
}

/** Whether two spans cover the same stretch. By loom's rule, a stretch has only one span. */
export function sameSpan(a: Span, b: Span): boolean {
  return samePosition(a.start, b.start) && samePosition(a.end, b.end)
}

function samePosition(a: Position, b: Position): boolean {
  return a.line === b.line && a.offset === b.offset
}

/** Negative when a comes before b, 0 when they are the same place, positive when a comes after. */
export function comparePositions(a: Position, b: Position): number {
  return a.line - b.line || a.offset - b.offset
}

/** The span between two positions, whichever comes first, moved inward past spaces and line ends
 * until it begins and ends on a character that is not a space; null when there is none between
 * them. Such a span keeps loom's rule, and loom can always write it: its first and last words are
 * quotes with no space at either end. */
export function trimmedSpan(substrate: Substrate, a: Position, b: Position): Span | null {
  let [start, end] = comparePositions(a, b) <= 0 ? [a, b] : [b, a]
  // Forwards from the start, to the first character that is not a space
  for (;;) {
    if (comparePositions(start, end) >= 0) return null
    const characters = codePoints(lineAt(substrate, start.line))
    if (start.offset >= characters.length) start = { line: start.line + 1, offset: 0 }
    else if (isSpace(characters[start.offset])) start = { ...start, offset: start.offset + 1 }
    else break
  }
  // Backwards from the end, to just after the last; the start's character stops it at the latest
  for (;;) {
    const characters = codePoints(lineAt(substrate, end.line))
    if (end.offset <= 0) end = { line: end.line - 1, offset: lineLength(substrate, end.line - 1) }
    else if (isSpace(characters[end.offset - 1])) end = { ...end, offset: end.offset - 1 }
    else break
  }
  return { start, end }
}

/** The word at a position, a run of characters that are not spaces: the one the character at the
 * position belongs to, or else the one the character just before it belongs to; null between
 * words. */
export function wordAt(substrate: Substrate, position: Position): Span | null {
  const characters = codePoints(lineAt(substrate, position.line))
  const { offset } = position
  const at = !isSpace(characters[offset])
    ? offset
    : offset > 0 && !isSpace(characters[offset - 1])
      ? offset - 1
      : null
  if (at === null) return null
  let start = at
  while (start > 0 && !isSpace(characters[start - 1])) start--
  let end = at + 1
  while (end < characters.length && !isSpace(characters[end])) end++
  return {
    start: { line: position.line, offset: start },
    end: { line: position.line, offset: end },
  }
}

/** The spans with one more among them: any that overlap or touch it, end to start with nothing
 * between, are joined with it into one span. Every span comes out in the poem's order. A line break
 * is something between: spans on neighbouring lines stay apart. */
export function joinSpan(spans: readonly Span[], span: Span): Span[] {
  const ordered = [...spans, span].sort((a, b) => comparePositions(a.start, b.start))
  const joined: Span[] = []
  for (const next of ordered) {
    const last = joined.at(-1)
    if (last !== undefined && comparePositions(next.start, last.end) <= 0) {
      const end = comparePositions(next.end, last.end) > 0 ? next.end : last.end
      joined[joined.length - 1] = { start: last.start, end }
    } else {
      joined.push(next)
    }
  }
  return joined
}

/** A span's stretch on each line it crosses, by offsets in code points, in order. Throws for a line
 * the substrate does not have. */
export function lineRangesOf(
  substrate: Substrate,
  span: Span,
): { line: number; start: number; end: number }[] {
  const { start, end } = span
  const ranges: { line: number; start: number; end: number }[] = []
  for (let line = start.line; line <= end.line; line++) {
    ranges.push({
      line,
      start: line === start.line ? start.offset : 0,
      end: line === end.line ? end.offset : lineLength(substrate, line),
    })
  }
  return ranges
}

/** Whether a character is a space of any kind; past a line's end there is no character, which
 * counts as one. */
function isSpace(character: string | undefined): boolean {
  return character === undefined || /^\s$/u.test(character)
}

function lineAt(substrate: Substrate, index: number): string {
  const line = substrate.lines[index]
  if (line === undefined) throw new RangeError(`no line at index ${index}`)
  return line
}

function isIn(substrate: Substrate, position: Position): boolean {
  const line = Number.isInteger(position.line) ? substrate.lines[position.line] : undefined
  return (
    line !== undefined &&
    Number.isInteger(position.offset) &&
    position.offset >= 0 &&
    position.offset <= codePoints(line).length
  )
}

/** A position as a person counts it: "3:7" is line 3, character 7. */
function positionText(position: Position): string {
  return `${position.line + 1}:${position.offset + 1}`
}
