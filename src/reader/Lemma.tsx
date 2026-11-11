import { Fragment } from "react"
import type { LemmaPart } from "./types"

/** A note's lemma, the head of its entry: its parts in order, the poem's own words quoted and
 * citations as they are. Whatever holds it decides what it is: a button in a list, a heading alone. */
export function Lemma({ lemma }: { lemma: LemmaPart[] }) {
  return lemma.map((part, i) => (
    <Fragment key={i}>
      {i > 0 && " · "}
      {part.kind === "quote" ? <q>{part.text}</q> : part.text}
    </Fragment>
  ))
}
