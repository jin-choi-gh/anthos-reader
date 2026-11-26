import { codePoints } from "../material/codePoints"
import type { Stanza } from "../material/types"

/** A poem's shape, as its lines are long: each line as its length in code points and its indent,
 * stanza by stanza. */
export type Shape = readonly (readonly { readonly length: number; readonly indent: number }[])[]

/** One line of a silhouette: where its bar starts, how far down, and how long it is, in pixels. */
export interface Bar {
  readonly x: number
  readonly y: number
  readonly width: number
}

/** How a silhouette is drawn: its width; how far in one level of indent sets a line; how tall a
 * line's bar is, the gap under it, and the extra gap between stanzas. */
export interface Measure {
  readonly width: number
  readonly indent: number
  readonly row: number
  readonly gap: number
  readonly stanzaGap: number
}

/** A poem's shape, from its stanzas. */
export function shapeOf(stanzas: readonly Stanza[]): Shape {
  return stanzas.map((stanza) =>
    stanza.lines.map((line) => ({ length: codePoints(line.text).length, indent: line.indent })),
  )
}

/** The longest line of a shape, in code points; 0 for a shape with no lines. */
export function longestOf(shape: Shape): number {
  return Math.max(0, ...shape.flat().map((line) => line.length))
}

/** A shape drawn as bars, one a line, in reading order, and the height they take. A line's bar is as
 * long as the line, on a scale where `longest` code points fill the width left after four levels of
 * indent; give every poem of a list the same `longest`, so that their shapes compare. A line with
 * text is never drawn shorter than one pixel; an empty line is no bar, but keeps its row. */
export function silhouetteOf(
  shape: Shape,
  longest: number,
  measure: Measure,
): { readonly bars: readonly Bar[]; readonly height: number } {
  const room = Math.max(1, measure.width - 4 * measure.indent)
  const scale = room / Math.max(1, longest)
  const bars: Bar[] = []
  let y = 0
  shape.forEach((stanza, s) => {
    if (s > 0) y += measure.stanzaGap
    for (const line of stanza) {
      if (line.length > 0) {
        const x = Math.min(line.indent, 4) * measure.indent
        bars.push({ x, y, width: Math.max(1, Math.round(line.length * scale * 10) / 10) })
      }
      y += measure.row + measure.gap
    }
  })
  return { bars, height: Math.max(0, y - measure.gap) }
}
