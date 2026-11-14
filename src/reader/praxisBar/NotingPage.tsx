import { useId } from "react"
import { Lemma } from "../../ui/Lemma"
import type { NotingProjection, PraxisBarProtocol } from "../scenes/types"

/** A new note, in the praxis bar: the toggle for choosing passages of the poem; the chosen targets,
 * one row each in the poem's order, with a button to remove each; the box for the note; and Add
 * note, which can be pressed once the box says something, as can Ctrl or Cmd with Enter in the box.
 * Every change goes to the scene, which holds the note so far and adds it. */
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
      <button
        type="button"
        className="praxis-button noting-toggle"
        aria-pressed={page.choosing}
        onClick={() => send({ kind: "choosing", on: !page.choosing })}
      >
        Choose passages
      </button>
      {page.chosen.length > 0 && (
        <ol className="noting-targets" aria-label="Chosen passages">
          {page.chosen.map((lemma, index) => (
            <li key={index} className="noting-target">
              <span className="noting-lemma">
                <Lemma lemma={[lemma]} />
              </span>
              <button
                type="button"
                className="noting-remove"
                aria-label={`Remove ${lemma.text}`}
                onClick={() => send({ kind: "unchoose", index })}
              >
                −
              </button>
            </li>
          ))}
        </ol>
      )}
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
