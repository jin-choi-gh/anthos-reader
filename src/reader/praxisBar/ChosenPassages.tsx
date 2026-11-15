import { Lemma } from "../../ui/Lemma"
import type { PassagesProjection, PraxisBarProtocol } from "../scenes/types"

/** The passages of a note being written: the toggle for choosing them in the poem, and the chosen
 * targets, one row each in the poem's order, each with a button to remove it. Both go to the
 * scene, which gives them to whichever part is choosing. */
export function ChosenPassages({
  passages,
  send,
}: {
  passages: PassagesProjection
  send: (message: PraxisBarProtocol["toScene"]) => void
}) {
  return (
    <>
      <button
        type="button"
        className="praxis-button noting-toggle"
        aria-pressed={passages.choosing}
        onClick={() => send({ kind: "choosing", on: !passages.choosing })}
      >
        Choose passages
      </button>
      {passages.chosen.length > 0 && (
        <ol className="noting-targets" aria-label="Chosen passages">
          {passages.chosen.map((lemma, index) => (
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
    </>
  )
}
