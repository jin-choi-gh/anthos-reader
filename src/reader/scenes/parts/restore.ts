import { assertNever } from "../../../assertNever"
import type {
  Effect,
  GapMessage,
  GapsProjection,
  RestoreMessage,
  RestoreSubject,
  SlipsProjection,
} from "../types"

/** The game so far: for each gap, in the poem's order, the slip that fills it, by its place among
 * the slips, or null; for each gap, whether it is restored, fixed for good, as a restored gap keeps
 * its slip; and how many slips the last check gave back, until the reader moves a slip again (null
 * otherwise). No slip fills two gaps. */
export interface RestoreState {
  readonly filled: readonly (number | null)[]
  readonly restored: readonly boolean[]
  readonly returned: number | null
}

/** A fresh game: every gap empty. A step restored already starts with every gap restored, each
 * filled by a slip with its text; the slips are the gaps' texts, so every gap has one. */
export function startRestoring(restore: RestoreSubject): RestoreState {
  if (!restore.restored) {
    return {
      filled: restore.gaps.map(() => null),
      restored: restore.gaps.map(() => false),
      returned: null,
    }
  }
  const taken = new Set<number>()
  const filled = restore.gaps.map((gap) => {
    const slip = restore.slips.findIndex((text, i) => text === gap.text && !taken.has(i))
    if (slip === -1) return null
    taken.add(slip)
    return slip
  })
  return { filled, restored: restore.gaps.map(() => true), returned: null }
}

/** The game once the frame has a fresh subject for the same step, from the subject it had `before`.
 * The same game, as after a new day or a note written elsewhere, is left as the reader has it. A
 * step restored since, here or in another tab, has every gap restored. Anything else, as a step no
 * longer restored, starts the game afresh. */
export function keepRestoring(
  before: RestoreSubject,
  restore: RestoreSubject,
  state: RestoreState,
): RestoreState {
  if (before.gaps.length !== restore.gaps.length) return startRestoring(restore)
  if (before.restored === restore.restored) return state
  if (restore.restored && isWhole(state)) return state
  return startRestoring(restore)
}

/** A slip the reader takes, or Check. A slip taken fills the first empty gap, in the poem's order;
 * a slip in a gap already, one that is not there, or no empty gap, changes nothing. Check, once
 * every gap is filled, restores each gap whose slip has its text, so that slips with the same text
 * fit each other's gaps, and gives back every other slip, emptying its gap; when it gives none back,
 * every gap is restored, and it sends out that the step is restored. Once every gap is restored,
 * nothing changes the game. What changes nothing gives back the very same state. */
export function onPraxisBar(
  restore: RestoreSubject,
  state: RestoreState,
  message: RestoreMessage,
): { state: RestoreState; effects: readonly Effect[] } {
  if (isWhole(state)) return { state, effects: [] }
  switch (message.kind) {
    case "take": {
      const { slip } = message
      const gap = state.filled.indexOf(null)
      if (restore.slips[slip] === undefined || state.filled.includes(slip) || gap === -1) {
        return { state, effects: [] }
      }
      const filled = state.filled.map((other, i) => (i === gap ? slip : other))
      return { state: { ...state, filled, returned: null }, effects: [] }
    }
    case "check": {
      if (state.filled.includes(null)) return { state, effects: [] }
      const right = state.filled.map(
        (slip, i) =>
          state.restored[i] === true ||
          (slip !== null && restore.slips[slip] === restore.gaps[i]?.text),
      )
      const filled = state.filled.map((slip, i) => (right[i] === true ? slip : null))
      const returned = right.filter((fits) => !fits).length
      const next = { filled, restored: right, returned }
      return { state: next, effects: returned === 0 ? [{ kind: "restored" }] : [] }
    }
    default:
      return assertNever(message)
  }
}

/** A filled gap the reader taps: its slip goes back among the slips, to its own place. An empty
 * gap, a restored one, or one that is not there changes nothing, and gives back the very same
 * state. */
export function onViewer(state: RestoreState, message: GapMessage): RestoreState {
  const { gap } = message
  if (state.filled[gap] === null || state.filled[gap] === undefined) return state
  if (state.restored[gap] === true) return state
  const filled = state.filled.map((slip, i) => (i === gap ? null : slip))
  return { ...state, filled, returned: null }
}

/** The gaps, for the viewer: empty ones with no text, since the text a gap takes out is never drawn
 * until it is restored; filled ones with the text of the slip in them; restored ones with the poem's
 * own; and the gap the next slip fills. */
export function gapsOf(restore: RestoreSubject, state: RestoreState): GapsProjection {
  const next = state.filled.indexOf(null)
  return {
    of: restore.of,
    next: next === -1 ? null : next,
    gaps: restore.gaps.map((gap, i) => {
      const slip = state.filled[i] ?? null
      if (state.restored[i] === true) return { state: "restored", span: gap.span, text: gap.text }
      if (slip === null) return { state: "empty", span: gap.span }
      return { state: "filled", span: gap.span, text: restore.slips[slip] ?? "" }
    }),
  }
}

/** The slips, for the praxis bar: each in its place, whether it is in a gap, and whether it is
 * matched there, its gap restored; whether Check may
 * be pressed; how many gaps are restored; how many slips the last check gave back; and whether the
 * poem is whole. */
export function trayOf(restore: RestoreSubject, state: RestoreState): SlipsProjection {
  const whole = isWhole(state)
  return {
    of: restore.of,
    slips: restore.slips.map((text, i) => {
      const gap = state.filled.indexOf(i)
      return { text, placed: gap !== -1, restored: gap !== -1 && state.restored[gap] === true }
    }),
    canCheck: !whole && !state.filled.includes(null),
    restored: state.restored.filter(Boolean).length,
    gaps: restore.gaps.length,
    returned: state.returned,
    whole,
  }
}

/** Whether every gap is restored. */
function isWhole(state: RestoreState): boolean {
  return state.restored.every(Boolean)
}
