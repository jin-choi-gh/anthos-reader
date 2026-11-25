import { useId } from "react"
import { Button, FieldHeading, FieldLabel, TextBox } from "../../components/controls"
import { Lemma } from "../../components/Lemma"
import type { PraxisBarProtocol, WritingProjection } from "../scenes/types"
import { ChosenPassages } from "./ChosenPassages"
import "./praxisBar.css"

/** A page of the reader's notebook, in the praxis bar. Being written: the passages, when the reader
 * chooses what the note is about, a box, Respond (when there is something new to send) and Cancel
 * (when there is a note to go back to). Written: the note, under its lemma when the reader chose
 * its passages, and Edit. Every keystroke and choice goes to the scene, which holds the draft;
 * nothing is kept until Respond. */
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
          {page.passages !== null && <ChosenPassages passages={page.passages} send={send} />}
          <FieldLabel htmlFor={box}>Your response</FieldLabel>
          <TextBox
            id={box}
            className="text-box--reader"
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
            {page.canCancel && <Button onClick={() => send({ kind: "cancel" })}>Cancel</Button>}
            <Button type="submit" className="notebook-submit" disabled={!page.canSubmit}>
              Respond
            </Button>
          </div>
        </form>
      )
    case "written":
      return (
        <div className="notebook-page">
          <FieldHeading>Your response</FieldHeading>
          {page.lemma !== null && (
            <p className="notebook-lemma">
              <Lemma lemma={page.lemma} />
            </p>
          )}
          <div className="notebook-written">
            {paragraphsOf(page.body).map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
          <div className="notebook-actions">
            <Button onClick={() => send({ kind: "edit" })}>Edit</Button>
          </div>
        </div>
      )
  }
}

/** A note's paragraphs: split at blank lines, as the reader wrote them. */
function paragraphsOf(body: string): string[] {
  return body.split(/\n\s*\n/).filter((paragraph) => paragraph.trim() !== "")
}
