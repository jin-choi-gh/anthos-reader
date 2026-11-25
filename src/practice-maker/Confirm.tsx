import { Button } from "../components/controls"

/** A question asked in place, before something that cannot be undone: the question, the button that
 * does it, and Keep, which leaves everything as it was. */
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
