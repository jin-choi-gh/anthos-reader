import { useId } from "react"
import type { NotingProjection, PraxisBarProtocol } from "../scenes/types"
import { ChosenPassages } from "./ChosenPassages"

/** A new note, in the praxis bar: its passages (the toggle for choosing them, and the chosen
 * targets); the box for the note; and Add note, which can be pressed once the box says something,
 * as can Ctrl or Cmd with Enter in the box. Every change goes to the scene, which holds the note so
 * far and adds it. */
export function NotingPage({
  page,
  send,
}: {
  page: NotingProjection
  send: (message: PraxisBarProtocol["toScene"]) => void
}) {
  const box = useId()

  return (
    <form
      className="notebook-page noting-page"
      onSubmit={(event) => {
        event.preventDefault()
        send({ kind: "addNote" })
      }}
    >
      <ChosenPassages passages={page} send={send} />
      <label htmlFor={box} className="notebook-label">
        Your note
      </label>
      <textarea
        id={box}
        className="notebook-box"
        rows={4}
        value={page.draft}
        onChange={(event) => send({ kind: "noteDraft", text: event.target.value })}
        onKeyDown={(event) => {
          // Ctrl or Cmd with Enter adds the note, as in a chat; Enter alone starts a new line
          if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
            event.preventDefault()
            send({ kind: "addNote" })
          }
        }}
      />
      <div className="notebook-actions">
        <button type="submit" className="praxis-button notebook-submit" disabled={!page.canAdd}>
          Add note
        </button>
      </div>
    </form>
  )
}
