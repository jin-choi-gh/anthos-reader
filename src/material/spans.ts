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
