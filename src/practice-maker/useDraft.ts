import { useRef, useState } from "react"
import type { Substrate, TextId } from "../material/types"
import { practiceFor } from "../practice/choose"
import { isPractice } from "../practice/guard"
import type { Practice } from "../practice/types"
import { clearValue, readValue, writeValue } from "../storage/value"
import { draftToKeep, newPractice, originOf, type Origin } from "./draft"
import { edited, type Edit } from "./edits"
import type { MadePractices } from "./useMadePractices"

/** The practice being made for a text, for as long as the component that holds it: the draft,
 * where it started from, whether it has changes not yet saved, and whether the browser is keeping
 * them; and what can be done with it. */
export interface Draft {
  practice: Practice
  origin: Origin
  unsaved: boolean
  kept: boolean
  /** Opened to start a new practice over changes not yet saved: whether to, not yet answered. */
  askingNew: boolean
  /** The answer: a new practice in place of the draft, or the draft kept. */
  answerNew(start: boolean): void
  /** Makes one change to the draft. */
  edit(edit: Edit): void
  /** Forgets the changes, going back to the practice the text runs. */
  discard(): void
  /** Starts a new practice, with a new id, in place of the draft. */
  startNew(): void
  /** Saves the draft, giving back what kept it from being saved: nothing when it was. */
  save(substrate: Substrate): string[]
  /** Takes back the saved practice the draft is, so that the text runs what it ran before. */
  takeBack(): void
}

/** The draft for a text: the one kept in the browser for it, or else the practice it runs, from
 * its practice files and the practices saved for it, or else a new practice, whose id is made here.
 * A changed draft is kept in the browser, until it is saved, discarded, or changed back to what it
 * started from. Opened `fresh`, it starts a new practice, asking first when the draft kept has
 * changes not yet saved. */
export function useDraft(
  text: TextId,
  files: readonly Practice[],
  made: MadePractices,
  fresh: boolean,
): Draft {
  const [opening] = useState(() => {
    const kept = readDraft(text)
    if (fresh && kept === null)
      return { stored: newPractice(text, crypto.randomUUID()), ask: false }
    return { stored: kept, ask: fresh }
  })
  const [stored, setStored] = useState(opening.stored)
  const [askingNew, setAskingNew] = useState(opening.ask)
  // The latest draft kept, so that two changes in one moment both land, the second on the first
  const latest = useRef(stored)
  // A new practice, for a text that runs none
  const [blank] = useState(() => newPractice(text, crypto.randomUUID()))
  const [kept, setKept] = useState(true)
  const base = practiceFor(text, files, made.practices) ?? blank
  const practice = stored ?? base
  const origin = originOf(practice, files, made.practices)

  /** Keeps a draft in the browser, or forgets it, and draws it. */
  const keep = (next: Practice | null) => {
    latest.current = next
    setStored(next)
    if (next === null) {
      clearValue(keyOf(text))
      setKept(true)
    } else {
      setKept(writeValue(keyOf(text), next))
    }
  }

  return {
    practice,
    origin,
    unsaved: stored !== null,
    kept,
    askingNew,
    answerNew(start) {
      setAskingNew(false)
      if (start) keep(newPractice(text, crypto.randomUUID()))
    },
    edit(edit) {
      const current = latest.current ?? base
      const next = edited(current, edit)
      if (next !== current) keep(draftToKeep(next, originOf(next, files, made.practices)))
    },
    discard() {
      keep(null)
    },
    startNew() {
      keep(newPractice(text, crypto.randomUUID()))
    },
    save(substrate) {
      const problems = made.save(latest.current ?? base, substrate)
      if (problems.length === 0) keep(null)
      return problems
    },
    takeBack() {
      if (origin.from !== "saved" || latest.current !== null) return
      made.withdraw(origin.practice.id)
    },
  }
}

/** The key a text's draft is kept under. */
function keyOf(text: TextId): string {
  return `anthos.v1.draft.${text}`
}

/** The draft kept for a text: a practice, for that text, or none. */
function readDraft(text: TextId): Practice | null {
  const draft = readValue(keyOf(text), isPractice)
  return draft !== null && draft.text === text ? draft : null
}
