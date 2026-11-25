import { useLayoutEffect, useRef } from "react"
import { Library } from "./library/Library"
import { FormPractice } from "./practice-maker/FormPractice"
import { Reader } from "./reader/Reader"
import { useRoute } from "./route"

function App() {
  const route = useRoute()
  // Which screen is open: null for the library, else the screen and its file
  const screen = route.screen === "library" ? null : `${route.screen}/${route.file}`
  useScrollToTopOnChange(screen)
  if (route.screen === "library") return <Library />
  // Form Practice, in development only: elsewhere its address opens the library. For a new file it
  // starts afresh, as a reader does
  if (route.screen === "form") {
    if (!import.meta.env.DEV) return <Library />
    return <FormPractice key={route.file} file={route.file} fresh={route.fresh} />
  }
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
