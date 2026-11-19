import { codePoints, isSpace } from "./codePoints"
import { comparePositions, lineLength, sameSpan, spanProblem } from "./spans"
import type { Span, Substrate } from "./types"

// loom's notation for what a note is about, read and placed as loom does (loom 2cab1d9, its notes
// format and its placing of heads). Where anthos refuses what loom takes, the comment says so.

/** A place on one line, as a notehead writes it: the line's id, then perhaps a quote from the line
 * and which occurrence of the quote, from 1. With no quote it is the whole line. */
interface Locator {
  readonly lineId: string
  readonly quote: string | null
  readonly occurrence: number
}

/** One target: a locator, or two joined by ~, from the first's start to the last's end. */
interface Target {
  readonly first: Locator
  readonly last: Locator | null
}

// What breaks a line when loom reads a notes file (Python's str.splitlines). A notehead holding one
// could not be written as a head in a notes file.
// oxlint-disable-next-line no-control-regex -- loom breaks lines at these control characters
const LINE_BREAK = /[\n\r\v\f\x1c-\x1e\x85\u{2028}\u{2029}]/u

// "ever[2]": a quote, then [n]. loom's digits are any decimal digits; anthos reads only 0 to 9.
const OCCURRENCE = /^(.+)\[(\p{Nd}+)\]$/su

/** A notehead placed on the substrate as loom places it: one span for each target, in the order
 * written; or, if it cannot be placed, why not, for the first target that cannot. Beyond what loom
 * refuses, anthos refuses a notehead loom could not read back as a head in a notes file (one with a
 * line break, or starting with a space or a tab), an occurrence not written in the digits 0 to 9,
 * and a target whose span breaks loom's rule for spans (the whole of a line with no text). */
export function spansOfNotehead(
  substrate: Substrate,
  notehead: string,
): { readonly spans: readonly Span[] } | { readonly problem: string } {
  const targets = readNotehead(notehead)
  if (typeof targets === "string") return { problem: targets }
  const spans: Span[] = []
  for (const target of targets) {
    const span = placeTarget(substrate, target)
    if (typeof span === "string") return { problem: span }
    const problem = spanProblem(substrate, span)
    if (problem !== null) return { problem: `${describeTarget(target)}: ${problem}` }
    spans.push(span)
  }
  return { spans }
}

/** Spans written as a notehead, so that placing it again gives the same spans, in the same order:
 * whole lines by their ids ("l5 ~ l6"); a passage within a line by its words ("l4 fellow"); a
 * passage across lines by its first and last words ("l2 He ~ l3 halves"); and, where loom would
 * misread those, by its first and last characters ("l1 a[2] ~ l1 a[3]"). Null for no spans, and
 * for a span loom cannot write: one of no length, one that breaks loom's rule for spans, or one
 * that starts or ends on a space inside a line. A passage chosen in the viewer is never one. */
export function noteheadOf(substrate: Substrate, spans: readonly Span[]): string | null {
  if (spans.length === 0) return null
  const writable = (span: Span) =>
    spanProblem(substrate, span) === null && comparePositions(span.start, span.end) < 0
  if (!spans.every(writable)) return null

  const ways = [wholeLines, quoted, byWords, byCharacters]
  const targets = spans.map(
    (span) =>
      ways
        .map((write) => write(substrate, span))
        .find((written) => written !== null && placesAs(substrate, written, [span])) ?? null,
  )
  const plain = joined(targets)
  if (plain !== null && placesAs(substrate, plain, spans)) return plain
  // Targets that place alone can still be misread once joined (a quote ending in "&&"). Written by
  // their characters, every quote ends in "]", and no joining can be misread.
  const strict = joined(spans.map((span) => byCharacters(substrate, span)))
  return strict !== null && placesAs(substrate, strict, spans) ? strict : null
}

function joined(targets: readonly (string | null)[]): string | null {
  return targets.every((target) => target !== null) ? targets.join(" && ") : null
}

/** Whether a notehead places exactly these spans, in this order. */
function placesAs(substrate: Substrate, notehead: string, spans: readonly Span[]): boolean {
  const placed = spansOfNotehead(substrate, notehead)
  return (
    "spans" in placed &&
    placed.spans.length === spans.length &&
    placed.spans.every((span, i) => {
      const other = spans[i]
      return other !== undefined && sameSpan(span, other)
    })
  )
}

// Reading a notehead

/** A notehead's targets, as loom reads them, or what is wrong with it. */
function readNotehead(notehead: string): Target[] | string {
  if (LINE_BREAK.test(notehead)) return "a notehead is one line, with no line break"
  if (notehead.startsWith(" ") || notehead.startsWith("\t")) {
    return "a notehead starts with a line's id, not a space"
  }
  if (strip(notehead) === "") return "a notehead with no targets"
  const targets: Target[] = []
  for (const part of notehead.split(" && ")) {
    // Spaces around && and ~ are forgiven
    const locators = part.split(" ~ ").map(strip)
    if (locators.length > 2) return `${JSON.stringify(part)} has more than one ~`
    const [firstText = "", lastText] = locators
    const first = readLocator(firstText)
    if (typeof first === "string") return first
    const last = lastText === undefined ? null : readLocator(lastText)
    if (typeof last === "string") return last
    targets.push({ first, last })
  }
  return targets
}

/** "l1 ever[2]": a line's id, then perhaps a quote, then perhaps [n]; or what is wrong with it. */
function readLocator(text: string): Locator | string {
  const space = text.indexOf(" ")
  const lineId = space < 0 ? text : text.slice(0, space)
  const rest = space < 0 ? "" : text.slice(space + 1)
  if (lineId === "") return "an empty target"
  if (rest === "") return { lineId, quote: null, occurrence: 1 }
  if (isSpace(codePoints(rest)[0])) return `one space between ${lineId} and its quote`
  const found = OCCURRENCE.exec(rest)
  const [, quote, digits] = found ?? []
  if (quote === undefined || digits === undefined) return { lineId, quote: rest, occurrence: 1 }
  if (!/^[0-9]+$/.test(digits)) return `[${digits}]: write an occurrence in the digits 0 to 9`
  const occurrence = Number(digits)
  if (occurrence < 1) return `occurrences count from 1, not ${occurrence}`
  if (isSpace(codePoints(quote).at(-1))) return `no space before [${occurrence}]`
  return { lineId, quote, occurrence }
}

/** A text without the spaces at either end, as loom strips them (Python's str.strip). */
function strip(text: string): string {
  const characters = codePoints(text)
  let start = 0
  let end = characters.length
  while (start < end && isSpace(characters[start])) start++
  while (end > start && isSpace(characters[end - 1])) end--
  return characters.slice(start, end).join("")
}

// Placing a notehead

/** One locator's span, or, for two joined by ~, from the first's start to the last's end; or why it
 * cannot be placed. The range must run forwards: the last must neither start nor end before the
 * first. */
function placeTarget(substrate: Substrate, target: Target): Span | string {
  const first = placeLocator(substrate, target.first)
  if (typeof first === "string" || target.last === null) return first
  const last = placeLocator(substrate, target.last)
  if (typeof last === "string") return last
  if (comparePositions(last.start, first.start) < 0 || comparePositions(last.end, first.end) < 0) {
    const [from, to] = [describe(target.first), describe(target.last)]
    return `the range must run forwards: ${to} does not come after ${from}`
  }
  return { start: first.start, end: last.end }
}

/** Where a locator points: its whole line, or the nth occurrence of its quote in that line, the
 * quote in NFC as the substrate is; or why it cannot be placed. */
function placeLocator(substrate: Substrate, locator: Locator): Span | string {
  const index = substrate.lines.findIndex((line) => line.id === locator.lineId)
  const line = substrate.lines[index]
  if (line === undefined) return `no line called ${locator.lineId}`
  if (locator.quote === null) {
    return {
      start: { line: index, offset: 0 },
      end: { line: index, offset: lineLength(substrate, index) },
    }
  }
  const quote = locator.quote.normalize("NFC")
  const at = occurrenceAt(line.text, quote, locator.occurrence)
  if (at === null) {
    const count = occurrencesIn(line.text, quote)
    const found = count === 0 ? "not in" : `only ${count} time(s) in`
    const where = `line ${locator.lineId}: ${JSON.stringify(line.text)}`
    return `${describe(locator)}: ${JSON.stringify(quote)} is ${found} ${where}`
  }
  const start = codePoints(line.text.slice(0, at)).length
  const end = start + codePoints(quote).length
  return { start: { line: index, offset: start }, end: { line: index, offset: end } }
}

/** Where the nth occurrence of a quote begins in a text, in UTF-16 units, counting occurrences
 * without overlaps, as loom does; null if there are fewer. Units and code points give the same
 * count, since each step is the whole quote's length in either. */
function occurrenceAt(text: string, quote: string, n: number): number | null {
  let at = -quote.length
  for (let i = 0; i < n; i++) {
    at = text.indexOf(quote, at + quote.length)
    if (at < 0) return null
  }
  return at
}

/** How many times a quote is in a text, counting without overlaps. */
function occurrencesIn(text: string, quote: string): number {
  let count = 0
  for (let at = text.indexOf(quote); at >= 0; at = text.indexOf(quote, at + quote.length)) count++
  return count
}

/** A locator as it is written: l1 "ever"[2], or l13 for a whole line. */
function describe(locator: Locator): string {
  if (locator.quote === null) return locator.lineId
  const occurrence = locator.occurrence === 1 ? "" : `[${locator.occurrence}]`
  return `${locator.lineId} ${JSON.stringify(locator.quote)}${occurrence}`
}

function describeTarget(target: Target): string {
  const first = describe(target.first)
  return target.last === null ? first : `${first} ~ ${describe(target.last)}`
}

// Writing a notehead: each way gives a target, or null where it does not apply

/** Whole lines: "l8", or "l5 ~ l6". */
function wholeLines(substrate: Substrate, span: Span): string | null {
  const { start, end } = span
  if (start.offset !== 0 || end.offset !== lineLength(substrate, end.line)) return null
  const first = idOf(substrate, start.line)
  return start.line === end.line ? first : `${first} ~ ${idOf(substrate, end.line)}`
}

/** A passage within one line, by its words: "l14 I offered him a Crumb". */
function quoted(substrate: Substrate, span: Span): string | null {
  const { start, end } = span
  if (start.line !== end.line) return null
  return locatorOf(substrate, start.line, start.offset, end.offset, false)
}

/** A passage by its first word, up to a space, and its last, after one: "l2 He ~ l3 halves". */
function byWords(substrate: Substrate, span: Span): string | null {
  const { start, end } = span
  const sameLine = start.line === end.line
  const firstLine = codePoints(lineText(substrate, start.line))
  const lastLine = codePoints(lineText(substrate, end.line))
  let firstEnd = start.offset
  const firstLimit = sameLine ? end.offset : firstLine.length
  while (firstEnd < firstLimit && !isSpace(firstLine[firstEnd])) firstEnd++
  let lastStart = end.offset
  const lastLimit = sameLine ? start.offset : 0
  while (lastStart > lastLimit && !isSpace(lastLine[lastStart - 1])) lastStart--
  if (firstEnd === start.offset || lastStart === end.offset) return null
  const first = locatorOf(substrate, start.line, start.offset, firstEnd, false)
  const last = locatorOf(substrate, end.line, lastStart, end.offset, false)
  return first === null || last === null ? null : `${first} ~ ${last}`
}

/** A passage by its first and last characters, each with its occurrence, so that every quote ends
 * in "]": "l1 a[2] ~ l1 a[3]". An end on a space is written as the whole line, where it is the
 * line's start or end; elsewhere, it cannot be written. */
function byCharacters(substrate: Substrate, span: Span): string | null {
  const { start, end } = span
  const firstLine = codePoints(lineText(substrate, start.line))
  const lastLine = codePoints(lineText(substrate, end.line))
  const first = isSpace(firstLine[start.offset])
    ? start.offset === 0
      ? idOf(substrate, start.line)
      : null
    : locatorOf(substrate, start.line, start.offset, start.offset + 1, true)
  const last = isSpace(lastLine[end.offset - 1])
    ? end.offset === lastLine.length
      ? idOf(substrate, end.line)
      : null
    : locatorOf(substrate, end.line, end.offset - 1, end.offset, true)
  if (first === null || last === null) return null
  const oneCharacter = start.line === end.line && end.offset - start.offset === 1
  return oneCharacter ? first : `${first} ~ ${last}`
}

/** A locator for the stretch of a line from one offset to another, in code points: the line's id
 * and the stretch's text as a quote, with its occurrence when it is not the first, when the quote
 * ends in "]" (which loom would read as an occurrence), or always if asked. Null when counting
 * occurrences without overlaps never reaches the stretch ("aa" from offset 1 in "aaa"). */
function locatorOf(
  substrate: Substrate,
  line: number,
  start: number,
  end: number,
  always: boolean,
): string | null {
  const text = lineText(substrate, line)
  const characters = codePoints(text)
  const quote = characters.slice(start, end).join("")
  const at = characters.slice(0, start).join("").length
  let n = 0
  let found = text.indexOf(quote)
  while (found >= 0 && found < at) {
    n++
    found = text.indexOf(quote, found + quote.length)
  }
  if (found !== at) return null
  const occurrence = always || n > 0 || quote.endsWith("]") ? `[${n + 1}]` : ""
  return `${idOf(substrate, line)} ${quote}${occurrence}`
}

function idOf(substrate: Substrate, line: number): string {
  const found = substrate.lines[line]
  if (found === undefined) throw new RangeError(`no line at index ${line}`)
  return found.id
}

function lineText(substrate: Substrate, line: number): string {
  const found = substrate.lines[line]
  if (found === undefined) throw new RangeError(`no line at index ${line}`)
  return found.text
}
