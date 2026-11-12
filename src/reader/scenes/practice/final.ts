import { reply } from "../reply"
import type { Behaviour, SubjectOf } from "../types"

/** The final stage: for now, the poem, and word that the practice is done. */
export const final: Behaviour<SubjectOf<"final">, SubjectOf<"final">> = {
  start: (subject) => reply(subject),
  fromViewer: (state) => reply(state),
  fromPraxisBar: (state) => reply(state),
  viewer: ({ text }) => ({ kind: "marked", text, marked: [], open: null }),
  praxisBar: () => ({ kind: "prose", paragraphs: ["You have finished!"] }),
}
