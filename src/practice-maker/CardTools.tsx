/** The tools in a card's top corner, in words: moving what the card shows earlier or later in the
 * reel, and removing it, each named for assistive technology by `what` ("step 3", "stage II"). A
 * move that cannot be made is still there, disabled, so that the row never shifts under the
 * pointer. */
export function CardTools({
  what,
  onUp,
  onDown,
  onRemove,
}: {
  what: string
  onUp: (() => void) | null
  onDown: (() => void) | null
  onRemove: () => void
}) {
  return (
    <div className="form-tools">
      <button
        type="button"
        className="form-tool"
        aria-label={`Move ${what} up`}
        disabled={onUp === null}
        onClick={() => onUp?.()}
      >
        earlier
      </button>
      <button
        type="button"
        className="form-tool"
        aria-label={`Move ${what} down`}
        disabled={onDown === null}
        onClick={() => onDown?.()}
      >
        later
      </button>
      <button type="button" className="form-tool" aria-label={`Remove ${what}`} onClick={onRemove}>
        remove
      </button>
    </div>
  )
}
