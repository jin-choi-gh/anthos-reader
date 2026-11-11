import { reply } from "./reply"
import type { Behaviour, SubjectOf } from "./types"

/** Annotate mode: its subject, and the note the reader has opened, if any. */
export interface AnnotateState {
  subject: SubjectOf<"annotate">
  open: number | null
}

/** Annotate mode: every note listed. A tap opens a note, or closes it if it is already open. */
export const annotate: Behaviour<SubjectOf<"annotate">, AnnotateState> = {
  start: (subject) => reply({ subject, open: null }),
  fromViewer: (state, message) => {
    switch (message.kind) {
      case "tapNote":
        return reply({ ...state, open: state.open === message.note ? null : message.note })
      case "closeNote":
        return reply(state) // the list has no X
    }
  },
  fromPraxisBar: (state) => reply(state),
  viewer: ({ subject: { text, notes }, open }) => ({
    kind: "listed",
    text,
    shown: notes.map((note) => note.index),
    open,
  }),
  praxisBar: () => null,
}
