import { assertNever } from "../../../assertNever"
import type { Span } from "../../../material/types"
import { choose, givenOut, onPassages as passagesAfter, passagesOf } from "../passages"
import type {
  Effect,
  NotingMessage,
  NotingProjection,
  NotingSubject,
  PassageMessage,
} from "../types"

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

/** A passage the reader chose in the viewer, chosen as passages are (passages.ts). */
export function onChoose(noting: NotingSubject, state: NotingState, span: Span): NotingState {
  return choose(noting.substrate, state, span)
}

/** The praxis bar's toggle for choosing, or − on a chosen target, as passages take them
 * (passages.ts). */
export function onPassages(state: NotingState, message: PassageMessage): NotingState {
  return passagesAfter(state, message)
}

/** What the reader writes in the praxis bar: types, or adds the note. Adding, while the draft says
 * something, sends out a new note, on the chosen targets or the whole poem when none is chosen,
 * with the subject's tags and the draft, trimmed, as its body; then a new note starts, with
 * choosing as it was. What changes nothing gives back the very same state. */
export function onPraxisBar(
  noting: NotingSubject,
  state: NotingState,
  message: NotingMessage,
): { state: NotingState; effects: readonly Effect[] } {
  switch (message.kind) {
    case "noteDraft":
      return {
        state: message.text === state.draft ? state : { ...state, draft: message.text },
        effects: [],
      }
    case "addNote": {
      const body = state.draft.trim()
      if (body === "") return { state, effects: [] }
      const targets = givenOut(noting.substrate, state.targets)
      return {
        state: { ...startNoting(), choosing: state.choosing },
        effects: [{ kind: "note", targets, tags: noting.tags, body }],
      }
    }
    default:
      return assertNever(message)
  }
}

/** What the praxis bar draws: the passages, the draft, and whether the note may be added, which is
 * once the draft says something. */
export function notingOf(noting: NotingSubject, state: NotingState): NotingProjection {
  return {
    ...passagesOf(noting.substrate, state),
    draft: state.draft,
    canAdd: state.draft.trim() !== "",
  }
}
