import { useLayoutEffect, useRef } from "react"
import { Library } from "./library/Library"
import { Reader } from "./reader/Reader"
import { useRoute } from "./route"

function App() {
  const route = useRoute()
  const file = route.screen === "reader" ? route.file : null // null: the library
  useScrollToTopOnChange(file)
  if (route.screen === "library") return <Library />
  // A new file is a new reader: nothing in one poem carries over to the next. A new mode is not a
  // new reader: the reader keeps its loaded text, and changes only its mode
  return <Reader key={route.file} file={route.file} mode={route.mode} />
}

/** When the screen changes, start the new one at its top, before it paints. Not on the first
 * render: a reload keeps the place the browser restores. */
function useScrollToTopOnChange(screen: string | null) {
  const previous = useRef(screen)
  useLayoutEffect(() => {
    if (previous.current === screen) return
    previous.current = screen
    window.scrollTo(0, 0)
  }, [screen])
}

export default App
