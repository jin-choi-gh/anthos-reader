import { Button } from "../components/controls"

/** A question asked in place, before something that cannot be undone: the question, then Keep,
 * which leaves everything as it was, and the button that does it, marked as the one that destroys. */
export function Confirm({
  question,
  yes,
  onYes,
  onNo,
}: {
  question: string
  yes: string
  onYes: () => void
  onNo: () => void
}) {
  return (
    <div className="form-confirm" role="group" aria-label={question}>
      <p>{question}</p>
      <div className="form-confirm-buttons">
        <Button onClick={onNo}>Keep</Button>
        <Button className="form-confirm-yes" onClick={onYes}>
          {yes}
        </Button>
      </div>
    </div>
  )
}
