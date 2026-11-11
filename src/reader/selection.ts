import type { MouseEvent } from "react"

/** Whether a click ends a text selection made inside what was clicked: then it is the end of a
 * selection, not a choice, and should change nothing. */
export function endsSelection(event: MouseEvent<HTMLElement>): boolean {
  const selection = window.getSelection()
  return (
    selection !== null &&
    !selection.isCollapsed &&
    event.currentTarget.contains(selection.anchorNode)
  )
}
