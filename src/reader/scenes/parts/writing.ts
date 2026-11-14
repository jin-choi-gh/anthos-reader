import type { ReaderNote } from "../../../notebook/types"
import type { Effect, PraxisBarProtocol, WritingProjection, WritingSubject } from "../types"

/** Whether the page is open for writing, and what is on it so far. */
export interface WritingState {
  readonly editing: boolean
  readonly draft: string
}

/** The note written here, if any: with one asked for, the first. */
function savedOf(writing: WritingSubject): ReaderNote | null {
  return writing.written[0] ?? null
}

/** A fresh page: open for writing if nothing is written yet; otherwise showing what was written. */
export function startWriting(writing: WritingSubject): WritingState {
  const saved = savedOf(writing)
  return { editing: saved === null, draft: saved?.body ?? "" }
}

/** The page once the notebook has changed, from what it held `before`. While it is being written, it
 * is left alone. A note that was there and is gone (forgotten, or withdrawn) leaves a blank page
 * again. Otherwise it shows what is written now. A page sent but not yet back from the notebook is
 * left alone: nothing was there before either. */
export function keepWriting(
  before: WritingSubject,
  writing: WritingSubject,
  state: WritingState,
): WritingState {
  if (state.editing) return state
  const saved = savedOf(writing)
  if (saved === null) return savedOf(before) === null ? state : startWriting(writing)
  return saved.body === state.draft ? state : { editing: false, draft: saved.body }
}

/** What the reader does on the page, and what, if anything, goes into the notebook. */
export function onPraxisBar(
  writing: WritingSubject,
  state: WritingState,
  message: PraxisBarProtocol["toScene"],
): { state: WritingState; effects: readonly Effect[] } {
  const saved = savedOf(writing)
  switch (message.kind) {
    case "draft":
      return {
        state:
          state.editing && message.text !== state.draft ? { ...state, draft: message.text } : state,
        effects: [],
      }
    case "submit": {
      if (!canSubmit(saved, state)) return { state, effects: [] }
      const body = state.draft.trim()
      const effect: Effect =
        saved === null
          ? { kind: "note", anchor: writing.anchor, body }
          : { kind: "revise", id: saved.id, body }
      return { state: { editing: false, draft: body }, effects: [effect] }
    }
    case "edit":
      if (state.editing || saved === null) return { state, effects: [] }
      return { state: { editing: true, draft: saved.body }, effects: [] }
    case "cancel":
      if (!state.editing || saved === null) return { state, effects: [] }
      return { state: { editing: false, draft: saved.body }, effects: [] }
  }
}

/** What the praxis bar draws: the page being written, with whether Respond and Cancel may be pressed;
 * or the note as written, with Edit. */
export function writingOf(writing: WritingSubject, state: WritingState): WritingProjection {
  const saved = savedOf(writing)
  if (!state.editing) return { kind: "written", body: saved?.body ?? state.draft }
  return {
    kind: "writing",
    draft: state.draft,
    canSubmit: canSubmit(saved, state),
    canCancel: saved !== null,
  }
}

/** A page can be sent when it says something, and something other than what is written already. */
function canSubmit(saved: ReaderNote | null, state: WritingState): boolean {
  const body = state.draft.trim()
  return state.editing && body !== "" && body !== saved?.body
}
