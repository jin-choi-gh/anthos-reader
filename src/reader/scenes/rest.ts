import { reply } from "./reply"
import type { Behaviour, SubjectOf } from "./types"

/** At the rest: the poem, with nothing highlighted. The frame's ruling says when the next stage
 * opens. */
export const rest: Behaviour<SubjectOf<"rest">, SubjectOf<"rest">> = {
  start: (subject) => reply(subject),
  fromViewer: (state) => reply(state),
  fromPraxisBar: (state) => reply(state),
  viewer: ({ text }) => ({ kind: "marked", text, marked: [], open: null }),
  praxisBar: () => null,
}
