import { assertNever } from "../../../assertNever"
import { lemmaOf } from "../../../material/notes"
import { joinSpan, spanProblem, wholePoem } from "../../../material/spans"
import type { LemmaPart, Span } from "../../../material/types"
import type { Effect, NotingMessage, NotingProjection, NotingSubject } from "../types"

/** The new note so far: whether choosing is on, the targets chosen, never overlapping and in the
 * poem's order, and the draft. */
export interface NotingState {
  readonly choosing: boolean
  readonly targets: readonly Span[]
  readonly draft: string
}

/** A new note: choosing off, nothing chosen, nothing written. */
export function startNoting(): NotingState {
  return { choosing: false, targets: [], draft: "" }
}

/** A passage the reader chose in the viewer: joined into the targets while choosing is on, with any
 * it overlaps or touches. Ignored while choosing is off, and when it breaks loom's rule for spans
 * on the subject's lines, which a passage from the viewer never does. */
export function onChoose(noting: NotingSubject, state: NotingState, span: Span): NotingState {
  if (!state.choosing || spanProblem(noting.substrate, span) !== null) return state
  return { ...state, targets: joinSpan(state.targets, span) }
}

/** What the reader does in the praxis bar: turns choosing on or off, removes a chosen target by its
 * place in the table, types, or adds the note. Adding, while the draft says something, sends out a
 * new note, on the chosen targets or the whole poem when none is chosen, with the subject's tags
 * and the draft, trimmed, as its body; then a new note starts, with choosing as it was. What
 * changes nothing gives back the very same state. */
export function onPraxisBar(
  noting: NotingSubject,
  state: NotingState,
  message: NotingMessage,
): { state: NotingState; effects: readonly Effect[] } {
  switch (message.kind) {
    case "choosing":
      return {
        state: message.on === state.choosing ? state : { ...state, choosing: message.on },
        effects: [],
      }
    case "unchoose":
      if (state.targets[message.index] === undefined) return { state, effects: [] }
      return {
        state: { ...state, targets: state.targets.filter((_, i) => i !== message.index) },
        effects: [],
      }
    case "noteDraft":
      return {
        state: message.text === state.draft ? state : { ...state, draft: message.text },
        effects: [],
      }
    case "addNote": {
      const body = state.draft.trim()
      if (body === "") return { state, effects: [] }
      const targets = state.targets.length > 0 ? state.targets : [wholePoem(noting.substrate)]
      return {
        state: { ...startNoting(), choosing: state.choosing },
        effects: [{ kind: "note", targets, tags: noting.tags, body }],
      }
    }
    default:
      return assertNever(message)
  }
}

/** What the praxis bar draws: the toggle, each target's lemma in the poem's order, the draft, and
 * whether the note may be added, which is once the draft says something. */
export function notingOf(noting: NotingSubject, state: NotingState): NotingProjection {
  return {
    choosing: state.choosing,
    chosen: state.targets.map((target) => lemmaOfTarget(noting, target)),
    draft: state.draft,
    canAdd: state.draft.trim() !== "",
  }
}

/** One target's lemma, as the notes give it. */
function lemmaOfTarget(noting: NotingSubject, target: Span): LemmaPart {
  const [part] = lemmaOf(noting.substrate, [target])
  if (part === undefined) throw new Error("a target with no lemma")
  return part
}
