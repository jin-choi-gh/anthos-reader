import { Fragment } from "react"

/** One part of a lemma, as anything that draws one gives it: the poem's own words, or a citation. */
interface LemmaPiece {
  readonly kind: "quote" | "citation"
  readonly text: string
}

/** A note's lemma, the head of its entry: its parts in order, the poem's own words quoted and
 * citations as they are. Whatever holds it decides what it is: a button in a list, a heading alone,
 * a row of a table. */
export function Lemma({ lemma }: { lemma: readonly LemmaPiece[] }) {
  return lemma.map((part, i) => (
    <Fragment key={i}>
      {i > 0 && " · "}
      {part.kind === "quote" ? <q>{part.text}</q> : part.text}
    </Fragment>
  ))
}
