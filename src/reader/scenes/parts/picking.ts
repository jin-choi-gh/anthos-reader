import type { Effect, PickMessage, PickingProjection, PickingSubject } from "../types"

/** The picking, for the viewer: each word or line to pick, and whether a gap takes it out, as the
 * subject has them. It keeps nothing of its own. */
export function pickingOf(picking: PickingSubject): PickingProjection {
  return { of: picking.of, units: picking.units }
}

/** A word or line picked in the viewer: it leaves as an effect, its span, for Form Practice to make
 * a gap of it or take the gap away. One that is not there sends out nothing. */
export function onPick(picking: PickingSubject, message: PickMessage): readonly Effect[] {
  const unit = picking.units[message.unit]
  return unit === undefined ? [] : [{ kind: "pick", span: unit.span }]
}
