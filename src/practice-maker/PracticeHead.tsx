import { useState, type Ref } from "react"
import { assertNever } from "../assertNever"
import { BackLink } from "../components/BackLink"
import { Button } from "../components/controls"
import { LightToggle } from "../LightToggle"
import type { Poem } from "../material/types"
import { libraryHref } from "../route"
import { Confirm } from "./Confirm"
import type { Draft } from "./useDraft"

/** The top bar, across the whole screen: the way back to the library, what the screen is, marked
 * as for development only, and at the right where the draft stands, Read, and whichever is there to
 * do: Discard and Save, while the draft has changes not yet saved; Take back, for a saved practice
 * with none; then the light toggle. Under it, when there is any: the question asked before discarding, taking back, or
 * starting a new practice over unsaved changes, when Edit practice was opened for one; a browser
 * that is not keeping the draft; and, after Save found things to put right (`unfinished`, while there
 * are any), how many, with the way to the next of them (`onNext`), or what kept the draft from being
 * saved (`refused`). */
export function PracticeHead({
  draft,
  readHref,
  unfinished,
  refused,
  onSave,
  onNext,
}: {
  draft: Draft
  readHref: string
  unfinished: number
  refused: readonly string[]
  onSave: () => void
  onNext: () => void
}) {
  const [asking, setAsking] = useState<"discard" | "takeBack" | null>(null)
  const { origin, unsaved } = draft
  const idle = asking === null && !draft.askingNew

  return (
    <header className="form-top">
      <div className="form-top-bar">
        <BackLink href={libraryHref}>Library</BackLink>
        <span className="form-what">edit practice</span>
        <span className="form-dev" title="Only in development">
          dev
        </span>
        <span className="form-spacer" />
        <span className="form-status">{statusOf(draft)}</span>
        <a className="form-read" href={readHref}>
          read
        </a>
        {idle && unsaved && (
          <>
            <Button onClick={() => setAsking("discard")}>Discard</Button>
            <Button className="button--primary" onClick={onSave}>
              Save
            </Button>
          </>
        )}
        {idle && !unsaved && origin.from === "saved" && (
          <Button onClick={() => setAsking("takeBack")}>Take back</Button>
        )}
        <LightToggle />
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
      {unfinished > 0 && (
        <p className="form-problem">
          Not saved: {unfinished} {unfinished === 1 ? "thing" : "things"} to put right.{" "}
          <button type="button" className="form-next" onClick={onNext}>
            Go to the next
          </button>
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

/** Where the draft stands, in a few words: changes not yet saved, or else just as it was saved in
 * the browser, or as its practice file has it. */
function statusOf(draft: Draft): string {
  const { origin } = draft
  if (draft.unsaved) return "Unsaved changes"
  switch (origin.from) {
    case "saved":
      return "Saved in this browser"
    case "file":
      return "As its practice file has it"
    case "new":
      return ""
    default:
      return assertNever(origin)
  }
}

/** The head of the reel: the practice's name, written in place as its heading, and the poem it is
 * a practice on. */
export function PracticeName({
  draft,
  poem,
  titleRef,
}: {
  draft: Draft
  poem: Poem
  titleRef: Ref<HTMLInputElement>
}) {
  return (
    <div className="form-name-block">
      <input
        ref={titleRef}
        className="form-title"
        type="text"
        value={draft.practice.title}
        placeholder="Name this practice"
        aria-label="The practice's name"
        onChange={(event) => draft.edit({ kind: "retitle", title: event.target.value })}
      />
      <p className="form-on">
        on {poem.title} · {poem.author}
      </p>
    </div>
  )
}
