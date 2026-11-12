import type { TextId } from "../../../material/types"
import type { Commentary, ViewerProjection, ViewerProtocol } from "../types"

// The commentary part: the editor's notes on the footage. Its state is the one note the reader has
// opened, by its index, or null. The iris and the viewing table differ only in how they are drawn,
// and in that the list has no X to close a note with.

/** What the reader does to the commentary: a tap opens a note, or closes it if it is open; the X
 * closes it. A tap on a note the commentary does not show changes nothing. */
export function onViewer(
  commentary: Commentary,
  open: number | null,
  message: ViewerProtocol["toScene"],
): number | null {
  switch (message.kind) {
    case "tapNote":
      if (!commentary.notes.some((note) => note.index === message.note)) return open
      return open === message.note ? null : message.note
    case "closeNote":
      return commentary.shown === "listed" ? open : null // the list has no X
  }
}

/** The open note, once the commentary is fresh: still open if it is still shown. */
export function keepOpen(commentary: Commentary, open: number | null): number | null {
  return commentary.notes.some((note) => note.index === open) ? open : null
}

/** What the viewer draws: the notes picked out in the poem, or listed beside it, and the open one. */
export function viewerOf(
  text: TextId,
  commentary: Commentary,
  open: number | null,
): ViewerProjection {
  const indexes = commentary.notes.map((note) => note.index)
  return commentary.shown === "marked"
    ? { kind: "marked", text, marked: indexes, open }
    : { kind: "listed", text, shown: indexes, open }
}
