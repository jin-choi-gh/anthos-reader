import { useId } from "react"
import { Lemma } from "../../ui/Lemma"
import type { NotingProjection, PraxisBarProtocol } from "../scenes/types"

/** A new note, in the praxis bar: the toggle for choosing passages of the poem; the chosen targets,
 * one row each in the poem's order, with a button to remove each; the box for the note; and Add
 * note, which can be pressed once the box says something. Every change goes to the scene, which
 * holds the note so far. */
export function NotingPage({
  page,
  send,
}: {
  page: NotingProjection
  send: (message: PraxisBarProtocol["toScene"]) => void
}) {
  const box = useId()

  return (
    <div className="notebook-page noting-page">
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
      />
      <div className="notebook-actions">
        <button type="button" className="praxis-button notebook-submit" disabled={!page.canAdd}>
          Add note
        </button>
      </div>
    </div>
  )
}
