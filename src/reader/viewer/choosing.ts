import { assertNever } from "../../assertNever"
import { comparePositions, lineRangesOf, trimmedSpan, wordAt } from "../../material/spans"
import type { Position, Span, Substrate } from "../../material/types"
import type { LineRange } from "./cut"

/** How finely a passage is chosen: to the character, or to whole words. */
export type Precision = "character" | "word"

/** How a passage is chosen: by dragging across it, or by tapping its first word and then its
 * last. */
export type Gesture = "drag" | "taps"

/** The pointers a reader chooses with, as the browser names them. */
export type Pointer = "mouse" | "pen" | "touch"

/** How each pointer chooses a passage, and how finely. To revise how choosing feels, change this
 * table: nothing else decides it. */
export const CHOOSING: Record<
  Pointer,
  { readonly gesture: Gesture; readonly precision: Precision }
> = {
  mouse: { gesture: "drag", precision: "character" },
  pen: { gesture: "drag", precision: "character" },
  touch: { gesture: "taps", precision: "word" },
}

/** How a pointer the browser names chooses: a pointer it does not name is taken for a mouse. */
export function choosingBy(pointerType: string): (typeof CHOOSING)[Pointer] {
  return pointerType === "pen" || pointerType === "touch" ? CHOOSING[pointerType] : CHOOSING.mouse
}

/** The passage between two positions the reader pointed at, in either order. To the character, it
 * is what lies between them; to whole words, it runs from the start of the first word to the end
 * of the last, and is null when either position is between words. Either way it is trimmed, so it
 * begins and ends on a character that is not a space, and is null when there is none. */
export function passageOf(
  substrate: Substrate,
  from: Position,
  to: Position,
  precision: Precision,
): Span | null {
  switch (precision) {
    case "character":
      return trimmedSpan(substrate, from, to)
    case "word": {
      const first = wordAt(substrate, from)
      const last = wordAt(substrate, to)
      if (first === null || last === null) return null
      const [a, b] = comparePositions(first.start, last.start) <= 0 ? [first, last] : [last, first]
      return trimmedSpan(substrate, a.start, b.end)
    }
    default:
      return assertNever(precision)
  }
}

/** Spans as each line's ranges, for cutting the line: a line no span crosses has none. */
export function rangesOnLines(
  substrate: Substrate,
  spans: readonly Span[],
): (line: number) => LineRange[] {
  const byLine = new Map<number, LineRange[]>()
  for (const span of spans) {
    for (const { line, start, end } of lineRangesOf(substrate, span)) {
      byLine.set(line, [...(byLine.get(line) ?? []), { start, end }])
    }
  }
  return (line) => byLine.get(line) ?? []
}
