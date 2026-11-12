import type { Effect, Reply } from "./types"

/** A reply: the next state, and what to write in the notebook, if anything. */
export function reply<State>(state: State, effects: readonly Effect[] = []): Reply<State> {
  return { state, effects }
}
