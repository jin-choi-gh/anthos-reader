import { useLayoutEffect, type RefObject } from "react"

/** Marks an element with whether it holds more than it can show (data-scrolls), so that only then
 * need it keep its scrolls to itself: with nothing to scroll, they are the page's; and, as it is
 * scrolled, whether more lies above what it shows (data-above) and below (data-below), so that its
 * edges can say so. It is measured again when it changes size, when what it holds does (`content`,
 * for an element whose own size does not follow what it holds), and when it is scrolled. */
export function useScrolls(
  ref: RefObject<HTMLElement | null>,
  content?: RefObject<HTMLElement | null>,
) {
  useLayoutEffect(() => {
    const element = ref.current
    if (element === null) return
    const update = () => {
      const { scrollTop, scrollHeight, clientHeight } = element
      element.dataset.scrolls = String(scrollHeight > clientHeight)
      element.dataset.above = String(scrollTop > 1)
      element.dataset.below = String(scrollTop + clientHeight < scrollHeight - 1)
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    if (content?.current) observer.observe(content.current)
    element.addEventListener("scroll", update, { passive: true })
    return () => {
      observer.disconnect()
      element.removeEventListener("scroll", update)
    }
  }, [ref, content])
}
