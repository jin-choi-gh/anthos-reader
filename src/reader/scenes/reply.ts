import type { Reply } from "./types"

/** A reply that only keeps a state: no messages to anyone. */
export function reply<State>(state: State): Reply<State> {
  return { state, toViewer: [], toPraxisBar: [] }
}
