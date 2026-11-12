import { useId } from "react"
import type { PraxisBarProtocol, WritingProjection } from "../scenes/types"

/** A page of the spectator's notebook, in the praxis bar. Being written: a box, Respond (when there
 * is something new to send) and Cancel (when there is a note to go back to). Written: the note, and
 * Edit. Every keystroke goes to the scene, which holds the draft; nothing is kept until Respond. */
export function NotebookPage({
  page,
  send,
}: {
  page: WritingProjection
  send: (message: PraxisBarProtocol["toScene"]) => void
}) {
  const box = useId()

  switch (page.kind) {
    case "writing":
      return (
        <form
          className="notebook-page"
          onSubmit={(event) => {
            event.preventDefault()
            send({ kind: "submit" })
          }}
        >
          <label htmlFor={box} className="notebook-label">
            Your response
          </label>
          <textarea
            id={box}
            className="notebook-box"
            rows={4}
            value={page.draft}
            onChange={(event) => send({ kind: "draft", text: event.target.value })}
            onKeyDown={(event) => {
              // Ctrl or Cmd with Enter sends, as in a chat; Enter alone starts a new line
              if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                event.preventDefault()
                send({ kind: "submit" })
              }
            }}
          />
          <div className="notebook-actions">
            {page.canCancel && (
              <button
                type="button"
                className="praxis-button"
                onClick={() => send({ kind: "cancel" })}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="praxis-button notebook-submit"
              disabled={!page.canSubmit}
            >
              Respond
            </button>
          </div>
        </form>
      )
    case "written":
      return (
        <div className="notebook-page">
          <p className="notebook-label">Your response</p>
          <div className="notebook-written">
            {paragraphsOf(page.body).map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
          <div className="notebook-actions">
            <button type="button" className="praxis-button" onClick={() => send({ kind: "edit" })}>
              Edit
            </button>
          </div>
        </div>
      )
  }
}

/** A note's paragraphs: split at blank lines, as the reader wrote them. */
function paragraphsOf(body: string): string[] {
  return body.split(/\n\s*\n/).filter((paragraph) => paragraph.trim() !== "")
}
