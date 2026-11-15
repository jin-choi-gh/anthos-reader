import { assertNever } from "../../assertNever"
import { lemmaOf } from "../../material/notes"
import { joinSpan, sameSpan, spanProblem, wholePoem } from "../../material/spans"
import type { LemmaPart, Span, Substrate } from "../../material/types"
import type { PassageMessage, PassagesProjection } from "./types"

/** Passages being chosen for a note: whether choosing is on, and the targets chosen so far, which
 * never overlap and are kept in the poem's order. The writing and the noting choose alike, so each
 * keeps these two among its own state. */
export interface Passages {
  readonly choosing: boolean
  readonly targets: readonly Span[]
}

/** A passage chosen in the viewer: joined into the targets while choosing is on, with any it
 * overlaps or touches. Ignored while choosing is off, and when it breaks loom's rule for spans on
 * these lines, which a passage from the viewer never does. Ignored, it gives back the very same
 * passages. */
export function choose<P extends Passages>(substrate: Substrate, passages: P, span: Span): P {
  if (!passages.choosing || spanProblem(substrate, span) !== null) return passages
  return { ...passages, targets: joinSpan(passages.targets, span) }
}

/** What the praxis bar does to the passages: turns choosing on or off, or removes a target by its
 * place in the table. What changes nothing gives back the very same passages. */
export function onPassages<P extends Passages>(passages: P, message: PassageMessage): P {
  switch (message.kind) {
    case "choosing":
      return message.on === passages.choosing ? passages : { ...passages, choosing: message.on }
    case "unchoose":
      if (passages.targets[message.index] === undefined) return passages
      return { ...passages, targets: passages.targets.filter((_, i) => i !== message.index) }
    default:
      return assertNever(message)
  }
}

/** What the praxis bar draws of the passages: whether choosing is on, and each target's lemma, as
 * the notes give it, in the poem's order. */
export function passagesOf(substrate: Substrate, passages: Passages): PassagesProjection {
  return {
    choosing: passages.choosing,
    chosen: passages.targets.map((target) => lemmaOfTarget(substrate, target)),
  }
}

/** A note's targets taken in hand, to be chosen again: joined where they overlap or touch, in the
 * poem's order; and none at all when that leaves only the whole poem, which is what no target
 * chosen means. Otherwise the first passage chosen would be joined into the whole poem, and lost. */
export function inHand(substrate: Substrate, targets: readonly Span[]): Span[] {
  const joined = targets.reduce<Span[]>((spans, span) => joinSpan(spans, span), [])
  const [only] = joined
  const whole = joined.length === 1 && only !== undefined && sameSpan(only, wholePoem(substrate))
  return whole ? [] : joined
}

/** The targets a note is written on: those chosen, or the whole poem when none is. */
export function givenOut(substrate: Substrate, targets: readonly Span[]): readonly Span[] {
  return targets.length > 0 ? targets : [wholePoem(substrate)]
}

/** Whether two lists of targets are the same, span for span, in the same order. */
export function sameTargets(a: readonly Span[], b: readonly Span[]): boolean {
  return (
    a.length === b.length &&
    a.every((span, i) => {
      const other = b[i]
      return other !== undefined && sameSpan(span, other)
    })
  )
}

/** One target's lemma, as the notes give it. */
function lemmaOfTarget(substrate: Substrate, target: Span): LemmaPart {
  const [part] = lemmaOf(substrate, [target])
  if (part === undefined) throw new Error("a target with no lemma")
  return part
}
