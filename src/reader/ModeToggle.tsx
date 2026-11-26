import { readerHref, replaceHref, type ModeName } from "../route"
import { Pen } from "../components/icons"
import "./modeToggle.css"

// Why the pen does nothing, while the reader puts the poem back together
const LOCKED = "Annotate opens once the poem is whole"

/** The pen in the top bar: switches the reader between practice mode and annotate mode, pressed in
 * annotate mode. It only changes the URL, in place, so switching adds nothing to the history and the
 * Back button still leaves the reader. Locked, at a step that restores and is not restored, it is
 * there but does nothing, and says why: it can still be reached and read, so that its note can be. */
export function ModeToggle({
  file,
  mode,
  locked = false,
}: {
  file: string
  mode: ModeName
  locked?: boolean
}) {
  const annotating = mode === "annotate"
  return (
    <button
      type="button"
      className="mode-toggle"
      aria-pressed={annotating}
      aria-disabled={locked}
      title={locked ? LOCKED : undefined}
      aria-description={locked ? LOCKED : undefined}
      onClick={() => {
        if (!locked) replaceHref(readerHref(file, annotating ? "practice" : "annotate"))
      }}
    >
      <Pen size={18} />
      Annotate
    </button>
  )
}
