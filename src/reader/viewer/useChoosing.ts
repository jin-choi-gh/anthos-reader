import { useEffect, useRef, useState, type RefObject } from "react"
import { wordAt } from "../../material/spans"
import type { Position, Span, Substrate } from "../../material/types"
import { positionAt } from "./caret"
import { choosingBy, passageOf, type Precision } from "./choosing"

/** How far a finger may move, in CSS pixels, and still be tapping rather than scrolling. */
const TAP_SLOP = 10

/** Choosing passages in an element holding the poem, while choosing is on. The browser selects
 * nothing there meanwhile, and shows no menu of its own. A drag chooses what it crosses, once it is
 * let go; taps choose from the first word tapped to the second. How each pointer chooses, and how
 * finely, is the CHOOSING table's. Each passage chosen goes to onChoose; what is being chosen, until
 * then, is given back to be drawn. */
export function useChoosing(
  area: RefObject<HTMLElement | null>,
  substrate: Substrate | null,
  choosing: boolean,
  onChoose: (span: Span) => void,
): Span | null {
  const [preview, setPreview] = useState<Span | null>(null)
  // The latest onChoose, so that a new one does not interrupt a drag
  const latest = useRef(onChoose)
  useEffect(() => {
    latest.current = onChoose
  }, [onChoose])

  useEffect(() => {
    const element = area.current
    if (!choosing || element === null || substrate === null) return

    let drag: { pointer: number; from: Position; to: Position; precision: Precision } | null = null
    let press: { pointer: number; x: number; y: number } | null = null
    let first: Position | null = null // the first word tapped, waiting for the last

    const choose = (span: Span | null) => {
      setPreview(null)
      if (span !== null) latest.current(span)
    }

    const down = (event: PointerEvent) => {
      if (event.button !== 0) return
      const way = choosingBy(event.pointerType)
      if (way.gesture === "taps") {
        press = { pointer: event.pointerId, x: event.clientX, y: event.clientY }
        return
      }
      const from = positionAt(event.clientX, event.clientY)
      if (from === null) return
      event.preventDefault() // no selection of the browser's, and no focus taken
      element.setPointerCapture(event.pointerId)
      drag = { pointer: event.pointerId, from, to: from, precision: way.precision }
      setPreview(null)
    }

    const move = (event: PointerEvent) => {
      if (drag === null || drag.pointer !== event.pointerId) return
      const to = positionAt(event.clientX, event.clientY)
      if (to === null) return
      drag = { ...drag, to }
      setPreview(passageOf(substrate, drag.from, to, drag.precision))
    }

    const up = (event: PointerEvent) => {
      if (drag !== null && drag.pointer === event.pointerId) {
        const { from, to, precision } = drag
        drag = null
        choose(
          passageOf(substrate, from, positionAt(event.clientX, event.clientY) ?? to, precision),
        )
        return
      }
      if (press === null || press.pointer !== event.pointerId) return
      const moved = Math.hypot(event.clientX - press.x, event.clientY - press.y) > TAP_SLOP
      press = null
      if (moved) return
      const at = positionAt(event.clientX, event.clientY)
      if (at === null) return
      const { precision } = choosingBy(event.pointerType)
      if (first === null) {
        if (precision === "word" && wordAt(substrate, at) === null) return // between words
        first = at
        setPreview(passageOf(substrate, at, at, precision))
        return
      }
      const from = first
      first = null
      choose(passageOf(substrate, from, at, precision))
    }

    // The browser took the pointer, to scroll: a press is no tap, and a drag is let go of
    const cancel = (event: PointerEvent) => {
      if (press !== null && press.pointer === event.pointerId) press = null
      if (drag !== null && drag.pointer === event.pointerId) {
        drag = null
        setPreview(null)
      }
    }

    // While choosing, the browser neither selects the poem nor offers its menu on a long press
    const refuse = (event: Event) => event.preventDefault()

    element.addEventListener("pointerdown", down)
    element.addEventListener("pointermove", move)
    element.addEventListener("pointerup", up)
    element.addEventListener("pointercancel", cancel)
    element.addEventListener("selectstart", refuse)
    element.addEventListener("contextmenu", refuse)
    return () => {
      element.removeEventListener("pointerdown", down)
      element.removeEventListener("pointermove", move)
      element.removeEventListener("pointerup", up)
      element.removeEventListener("pointercancel", cancel)
      element.removeEventListener("selectstart", refuse)
      element.removeEventListener("contextmenu", refuse)
      setPreview(null) // choosing turned off, or the poem changed: nothing is being chosen
    }
  }, [area, substrate, choosing])

  return preview
}
