import { reply } from "../../reply"
import type { Behaviour, SubjectOf } from "../../types"

/** A consider step: its subject, and whether the reader has opened its note. */
export interface ConsiderState {
  subject: SubjectOf<"consider">
  open: boolean
}

/** A consider step: the step's note highlighted in the poem, and its prose in the praxis bar.
 * Tapping the highlight opens the note, and tapping it again closes it, as does the note's X. */
export const consider: Behaviour<SubjectOf<"consider">, ConsiderState> = {
  start: (subject) => reply({ subject, open: false }),
  fromViewer: (state, message) => {
    switch (message.kind) {
      case "tapNote":
        return state.subject.note?.index === message.note
          ? reply({ ...state, open: !state.open })
          : reply(state)
      case "closeNote":
        return state.open ? reply({ ...state, open: false }) : reply(state)
    }
  },
  fromPraxisBar: (state) => reply(state),
  viewer: ({ subject: { text, note }, open }) =>
    note === null
      ? { kind: "marked", text, marked: [], open: null }
      : { kind: "marked", text, marked: [note.index], open: open ? note.index : null },
  praxisBar: ({ subject }) => ({ kind: "prose", paragraphs: subject.prose }),
}
