import type { ReactNode } from "react"
import { ArrowDown, ArrowUp, Bin } from "../components/icons"

/** The head of a card: its heading, as the praxis bar's, and in its corner, where an open note has
 * its ×, moving what it shows up or down and removing it, each named for assistive technology by
 * `what` ("step 3", "stage II"). A move that cannot be made is not offered. */
export function CardHead({
  heading,
  what,
  onUp,
  onDown,
  onRemove,
}: {
  heading: ReactNode
  what: string
  onUp: (() => void) | null
  onDown: (() => void) | null
  onRemove: () => void
}) {
  return (
    <div className="form-card-head">
      <h2 className="praxis-heading">{heading}</h2>
      <div className="form-icons">
        <button
          type="button"
          className="form-icon"
          aria-label={`Move ${what} up`}
          title="Move up"
          disabled={onUp === null}
          onClick={() => onUp?.()}
        >
          <ArrowUp size={18} />
        </button>
        <button
          type="button"
          className="form-icon"
          aria-label={`Move ${what} down`}
          title="Move down"
          disabled={onDown === null}
          onClick={() => onDown?.()}
        >
          <ArrowDown size={18} />
        </button>
        <button
          type="button"
          className="form-icon"
          aria-label={`Remove ${what}`}
          title="Remove"
          onClick={onRemove}
        >
          <Bin size={18} />
        </button>
      </div>
    </div>
  )
}
