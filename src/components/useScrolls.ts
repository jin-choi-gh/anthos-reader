import { useLayoutEffect, type RefObject } from "react"

/** Marks an element with whether it holds more than it can show (data-scrolls), so that only then
 * need it keep its scrolls to itself: with nothing to scroll, they are the page's. The element grows
 * with what it holds until it is as tall as it may be, so its own size tells of both what it holds
 * and the window. */
export function useScrolls(ref: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const element = ref.current
    if (element === null) return
    const update = () => {
      element.dataset.scrolls = String(element.scrollHeight > element.clientHeight)
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])
}
