import { useId, type ReactNode } from "react"
import { Button, FieldLabel, TextBox } from "../../components/controls"
import type { NotingProjection, PraxisBarProtocol } from "../scenes/types"
import { ChosenPassages } from "./ChosenPassages"
import "./praxisBar.css"

/** A new note, in the praxis bar: its passages (the toggle for choosing them, and the chosen
 * targets); the box for the note, under its label ("Your note" unless given another); and the
 * button that adds it ("Add note" unless given another), which can be pressed once the box says
 * something, as can Ctrl or Cmd with Enter in the box; and, when given, Cancel, and other actions
 * before it. Every change goes to the scene, which holds the note so far and adds it. */
export function NotingPage({
  page,
  send,
  label = "Your note",
  submit = "Add note",
  onCancel,
  actions,
}: {
  page: NotingProjection
  send: (message: PraxisBarProtocol["toScene"]) => void
  label?: string
  submit?: string
  onCancel?: (() => void) | undefined
  actions?: ReactNode
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
      <FieldLabel htmlFor={box}>{label}</FieldLabel>
      <TextBox
        id={box}
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
        {actions}
        {onCancel !== undefined && <Button onClick={onCancel}>Cancel</Button>}
        <Button type="submit" className="notebook-submit" disabled={!page.canAdd}>
          {submit}
        </Button>
      </div>
    </form>
  )
}
