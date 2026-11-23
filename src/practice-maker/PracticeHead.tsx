import { useState, type Ref } from "react"
import { Button } from "../components/controls"
import { Confirm } from "./Confirm"
import type { Draft } from "./useDraft"

/** The first part of the margin: the practice's name, written in place as its heading, and beside
 * it whichever is there to do: Save and Discard, while the draft has changes not yet saved; Take
 * back, for a saved practice with none; or nothing. Discarding and taking back ask first, as does
 * starting a new practice over unsaved changes, when Form Practice was opened for one. What kept
 * the last save from being kept, and a browser that is not keeping the draft, are said under it. */
export function PracticeHead({
  draft,
  titleRef,
  refused,
  onSave,
}: {
  draft: Draft
  titleRef: Ref<HTMLInputElement>
  refused: readonly string[]
  onSave: () => void
}) {
  const [asking, setAsking] = useState<"discard" | "takeBack" | null>(null)
  const { practice, origin, unsaved } = draft

  return (
    <header className="form-head">
      <div className="form-title-row">
        <input
          ref={titleRef}
          className="form-title"
          type="text"
          value={practice.title}
          placeholder="Name this practice"
          aria-label="The practice's name"
          onChange={(event) => draft.edit({ kind: "retitle", title: event.target.value })}
        />
        {asking === null && !draft.askingNew && unsaved && (
          <div className="form-buttons">
            <Button className="form-save" onClick={onSave}>
              Save
            </Button>
            <Button onClick={() => setAsking("discard")}>Discard</Button>
          </div>
        )}
        {asking === null && !draft.askingNew && !unsaved && origin.from === "saved" && (
          <Button onClick={() => setAsking("takeBack")}>Take back</Button>
        )}
      </div>
      {draft.askingNew && (
        <Confirm
          question="Start a new practice for this poem? The changes not yet saved are lost."
          yes="Start new"
          onYes={() => draft.answerNew(true)}
          onNo={() => draft.answerNew(false)}
        />
      )}
      {asking === "discard" && (
        <Confirm
          question="Discard the changes not yet saved?"
          yes="Discard"
          onYes={() => {
            setAsking(null)
            draft.discard()
          }}
          onNo={() => setAsking(null)}
        />
      )}
      {asking === "takeBack" && (
        <Confirm
          question="Take back this saved practice? The poem goes back to the practice it ran before."
          yes="Take back"
          onYes={() => {
            setAsking(null)
            draft.takeBack()
          }}
          onNo={() => setAsking(null)}
        />
      )}
      {!draft.kept && (
        <p className="form-problem">
          This browser is not keeping the changes: its storage is off or full.
        </p>
      )}
      {refused.map((reason, i) => (
        <p key={i} className="form-problem">
          {reason}
        </p>
      ))}
    </header>
  )
}
