import { useLayoutEffect, useRef } from "react"
import { Library } from "./library/Library"
import { Reader } from "./reader/Reader"
import { useRoute } from "./route"

function App() {
  const route = useRoute()
  const file = route.screen === "reader" ? route.file : null // null: the library
  useScrollToTopOnChange(file)
  // A new file is a new reader: nothing selected in one poem carries over to the next
  return file === null ? <Library /> : <Reader key={file} file={file} />
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
