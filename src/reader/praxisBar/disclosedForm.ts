import type { PageOrSpread } from "../../components/usePlatform"

/** How the notes disclosed are drawn, from the layout and how many notes the step has in all, never
 * from the window's size, so that a step keeps its form from its first note to its last: on a spread,
 * every note in full, in a list the margin scrolls ("list"); on a page, the note being read and a row
 * of numbers to move between them ("numbers"), or, for a step of one note, which has nothing to move
 * between, no row ("none"). */
export function formOf(layout: PageOrSpread, count: number): "list" | "numbers" | "none" {
  if (layout === "spread") return "list"
  return count <= 1 ? "none" : "numbers"
}

/** How far the row of numbers scrolls (`left`) for a number (from `start` up to `end`, in the row's
 * own measure, from its first number) to be seen whole, kept `clear` of the row's faded edges,
 * unless that edge is the row's own end, which is not faded. `width` is how much of the row is seen,
 * `total` how long it is. A number seen already, clear of the edges, leaves the row where it is. */
export function scrolledToShow(
  item: { start: number; end: number },
  row: { left: number; width: number; total: number },
  clear: number,
): number {
  const most = Math.max(0, row.total - row.width)
  const from = Math.max(0, item.start - clear)
  const to = Math.min(row.total, item.end + clear)
  let left = row.left
  if (from < left) left = from
  else if (to > left + row.width) left = to - row.width
  return Math.min(most, Math.max(0, left))
}
