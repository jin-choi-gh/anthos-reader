import { assertNever } from "../../../assertNever"
import { lemmaOf } from "../../../material/notes"
import type { Span, Substrate } from "../../../material/types"
import type { ReaderNote } from "../../../notebook/types"
import {
  choose,
  givenOut,
  inHand,
  onPassages as passagesAfter,
  passagesOf,
  sameTargets,
  type Passages,
} from "../passages"
import type {
  Effect,
  PassageMessage,
  WritingMessage,
  WritingProjection,
  WritingSubject,
} from "../types"

/** Whether the page is open for writing, what is on it so far, and, when the reader chooses what
 * the note is about, its passages; null when the step fixes what it is about. */
export interface WritingState {
  readonly editing: boolean
  readonly draft: string
  readonly passages: Passages | null
}

/** The note written here, if any: with one asked for, the first. */
function savedOf(writing: WritingSubject): ReaderNote | null {
  return writing.written[0] ?? null
}

/** The lines the reader chooses passages from, when they choose what the note is about. */
function linesOf(writing: WritingSubject): Substrate | null {
  return writing.about.kind === "chosen" ? writing.about.substrate : null
}

/** The passages of a page that shows a note, or a blank page (no note): the note's targets taken
 * in hand, with choosing off; null when the step fixes what the note is about. */
function passagesFrom(writing: WritingSubject, note: ReaderNote | null): Passages | null {
  const lines = linesOf(writing)
  if (lines === null) return null
  return { choosing: false, targets: note === null ? [] : inHand(lines, note.targets) }
}

/** A fresh page: open for writing if nothing is written yet; otherwise showing what was written. */
export function startWriting(writing: WritingSubject): WritingState {
  const saved = savedOf(writing)
  return {
    editing: saved === null,
    draft: saved?.body ?? "",
    passages: passagesFrom(writing, saved),
  }
}

/** The page once the notebook has changed, from what it held `before`, as in another tab. What the
 * reader has typed or chosen and not sent is theirs, and is left alone. Otherwise the page follows
 * the notebook: a note that arrives is shown, a note revised is shown as revised (still open, if
 * the reader had opened it, with choosing as it was), and a note that is gone (forgotten, or
 * withdrawn) leaves a blank page. A page sent but not yet back from the notebook is left alone:
 * nothing was there before either. */
export function keepWriting(
  before: WritingSubject,
  writing: WritingSubject,
  state: WritingState,
): WritingState {
  const was = savedOf(before)
  const saved = savedOf(writing)
  if (state.editing) {
    if (!holds(before, was, state)) return state // typed or chosen: the reader's
    if (saved === null) return was === null ? state : startWriting(writing)
    if (was === null) return startWriting(writing)
    if (holds(writing, saved, state)) return state
    const passages = passagesFrom(writing, saved)
    return {
      editing: true,
      draft: saved.body,
      passages:
        passages === null || state.passages === null
          ? passages
          : { ...passages, choosing: state.passages.choosing },
    }
  }
  if (saved === null) return was === null ? state : startWriting(writing)
  if (holds(writing, saved, state)) return state
  return { editing: false, draft: saved.body, passages: passagesFrom(writing, saved) }
}

/** Whether the page holds just what a note says (or, with no note, nothing): its words, and its
 * passages when the reader chooses them. */
function holds(writing: WritingSubject, note: ReaderNote | null, state: WritingState): boolean {
  if (state.draft !== (note?.body ?? "")) return false
  const passages = passagesFrom(writing, note)
  return (
    passages === null ||
    state.passages === null ||
    sameTargets(state.passages.targets, passages.targets)
  )
}

/** What the reader does on the page, and what, if anything, goes into the notebook. Respond sends
 * out a new note, or a revision of the one written here: on the targets the step fixes (for a
 * revision, the note's own), or on the passages chosen, or the whole poem when none is. */
export function onPraxisBar(
  writing: WritingSubject,
  state: WritingState,
  message: WritingMessage,
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
      if (!canSubmit(writing, saved, state)) return { state, effects: [] }
      const body = state.draft.trim()
      const targets = targetsOf(writing, saved, state)
      const effect: Effect =
        saved === null
          ? { kind: "note", targets, tags: writing.tags, body }
          : { kind: "revise", id: saved.id, targets, body }
      const passages = state.passages === null ? null : { ...state.passages, choosing: false }
      return { state: { editing: false, draft: body, passages }, effects: [effect] }
    }
    case "edit":
      if (state.editing || saved === null) return { state, effects: [] }
      return {
        state: { editing: true, draft: saved.body, passages: passagesFrom(writing, saved) },
        effects: [],
      }
    case "cancel":
      if (!state.editing || saved === null) return { state, effects: [] }
      return {
        state: { editing: false, draft: saved.body, passages: passagesFrom(writing, saved) },
        effects: [],
      }
    default:
      return assertNever(message)
  }
}

/** A passage the reader chose in the viewer, chosen as passages are (passages.ts): only while the
 * page is open for writing and the reader chooses what the note is about. Otherwise, or when it
 * changes nothing, the very same state. */
export function onChoose(writing: WritingSubject, state: WritingState, span: Span): WritingState {
  const lines = linesOf(writing)
  if (!state.editing || lines === null || state.passages === null) return state
  const passages = choose(lines, state.passages, span)
  return passages === state.passages ? state : { ...state, passages }
}

/** The praxis bar's toggle for choosing, or − on a chosen target, as passages take them
 * (passages.ts): only while the page is open for writing and the reader chooses what the note is
 * about. Otherwise, or when it changes nothing, the very same state. */
export function onPassages(state: WritingState, message: PassageMessage): WritingState {
  if (!state.editing || state.passages === null) return state
  const passages = passagesAfter(state.passages, message)
  return passages === state.passages ? state : { ...state, passages }
}

/** The passages being chosen, for the viewer to draw: only while the page is open for writing and
 * the reader chooses what the note is about. */
export function choosingOf(state: WritingState): Passages | null {
  return state.editing ? state.passages : null
}

/** What the praxis bar draws: the page being written, with whether Respond and Cancel may be
 * pressed and its passages; or the note as written, with Edit and its lemma when the reader chose
 * its passages. */
export function writingOf(writing: WritingSubject, state: WritingState): WritingProjection {
  const saved = savedOf(writing)
  const lines = linesOf(writing)
  if (!state.editing) {
    const lemma =
      lines === null
        ? null
        : lemmaOf(lines, saved?.targets ?? givenOut(lines, state.passages?.targets ?? []))
    return { kind: "written", body: saved?.body ?? state.draft, lemma }
  }
  return {
    kind: "writing",
    draft: state.draft,
    canSubmit: canSubmit(writing, saved, state),
    canCancel: saved !== null,
    passages: lines === null || state.passages === null ? null : passagesOf(lines, state.passages),
  }
}

/** The targets Respond writes on. */
function targetsOf(
  writing: WritingSubject,
  saved: ReaderNote | null,
  state: WritingState,
): readonly Span[] {
  const { about } = writing
  switch (about.kind) {
    case "fixed":
      return saved?.targets ?? about.targets
    case "chosen":
      return givenOut(about.substrate, state.passages?.targets ?? [])
    default:
      return assertNever(about)
  }
}

/** A page can be sent when it says something, and something other than what is written already:
 * other words, or other passages. */
function canSubmit(
  writing: WritingSubject,
  saved: ReaderNote | null,
  state: WritingState,
): boolean {
  const body = state.draft.trim()
  if (!state.editing || body === "") return false
  return saved === null || !holds(writing, saved, { ...state, draft: body })
}
