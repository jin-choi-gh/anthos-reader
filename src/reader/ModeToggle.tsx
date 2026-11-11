import { readerHref, replaceHref, type ModeName } from "../route"
import { Pen } from "../ui/icons"

/** The pen in the top bar: switches the reader between practice mode and annotate mode, pressed in
 * annotate mode. It only changes the URL, in place, so switching adds nothing to the history and the
 * Back button still leaves the reader. */
export function ModeToggle({ file, mode }: { file: string; mode: ModeName }) {
  const annotating = mode === "annotate"
  return (
    <button
      type="button"
      className="mode-toggle"
      aria-pressed={annotating}
      onClick={() => replaceHref(readerHref(file, annotating ? "practice" : "annotate"))}
    >
      <Pen size={18} />
      Annotate
    </button>
  )
}
