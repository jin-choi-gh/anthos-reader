import { lineRangesOf } from "../../material/spans"
import type { Substrate } from "../../material/types"
import type { GapsProjection, PickingProjection } from "../scenes/types"
import type { LineRange } from "./cut"

/** A gap's stretch of one line, and which gap it is: its place among the gaps, in the poem's order. */
export interface GapRange extends LineRange {
  gap: number
}

/** A word's or line's stretch of one line, to pick, and which it is: its place among the units. */
export interface PickRange extends LineRange {
  unit: number
}

/** Each line's words or lines to pick, by the line's place in the substrate: none for a line with
 * none, and none at all when there is nothing to pick. */
export function pickRangesOn(
  substrate: Substrate,
  picking: PickingProjection | null,
): (line: number) => PickRange[] {
  const byLine = new Map<number, PickRange[]>()
  picking?.units.forEach((unit, index) => {
    for (const { line, start, end } of lineRangesOf(substrate, unit.span)) {
      byLine.set(line, [...(byLine.get(line) ?? []), { start, end, unit: index }])
    }
  })
  return (line) => byLine.get(line) ?? []
}

/** Each line's gap ranges, by the line's place in the substrate: none for a line no gap is on, and
 * none at all when there is no restore. A word gap is a stretch of its line; a line gap is the
 * whole line. */
export function gapRangesOn(
  substrate: Substrate,
  restore: GapsProjection | null,
): (line: number) => GapRange[] {
  const byLine = new Map<number, GapRange[]>()
  restore?.gaps.forEach((gap, index) => {
    for (const { line, start, end } of lineRangesOf(substrate, gap.span)) {
      byLine.set(line, [...(byLine.get(line) ?? []), { start, end, gap: index }])
    }
  })
  return (line) => byLine.get(line) ?? []
}

/** The word or line a key moves to from another: the one before or after it (Left, Right), the
 * first on the line before or after its line (Up, Down), the first or the last (Home, End); null for
 * any other key, or past either end. */
export function unitByKey(
  units: readonly { span: { start: { line: number } } }[],
  from: number,
  key: string,
): number | null {
  const lineOf = (unit: number) => units[unit]?.span.start.line ?? -1
  const firstOn = (line: number) => units.findIndex((unit) => unit.span.start.line === line)
  const here = lineOf(from)
  let to: number | null = null
  switch (key) {
    case "ArrowLeft":
      to = from - 1
      break
    case "ArrowRight":
      to = from + 1
      break
    case "ArrowUp": {
      const before = units.slice(0, from).findLast((unit) => unit.span.start.line < here)
      to = before === undefined ? null : firstOn(before.span.start.line)
      break
    }
    case "ArrowDown": {
      const after = units.findIndex((unit) => unit.span.start.line > here)
      to = after === -1 ? null : after
      break
    }
    case "Home":
      to = 0
      break
    case "End":
      to = units.length - 1
      break
    default:
      return null
  }
  return to !== null && to >= 0 && to < units.length ? to : null
}
