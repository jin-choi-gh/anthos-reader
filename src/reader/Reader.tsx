import { useRef } from "react"
import type { Line, Stanza, Poem } from "./types"
import { useLayout } from "./useLayout"
import { TitleBlock } from "./TitleBlock"
import { PoemBlock } from "./PoemBlock"
import { Margin } from "./Margin"
import { BottomSheet } from "./BottomSheet"
import "./reader.css"

export function Reader() {
  const ref = useRef<HTMLDivElement>(null)
  const layout = useLayout(ref)

  let line1 = {
    id: "l1",
    text: "That is no country for old men, the young"
  } as Line

  let line2 = {
    id: "l2",
    text: "In one another's arms, birds in the trees,"
  } as Line

  let line3 = {
    id: "l3",
    text: "Those dying generations at their song"
  } as Line

  let line4 = {
    id: "l4",
    text: "The salmon-falls, the mackerel-crowded seas"
  } as Line

  let line5 = {
    id: "l5",
    text: "Fish, flesh, or fowl, commend all summer long"
  } as Line

  let stanza = {
    lines: [line1, line2, line3, line4, line5]
  } as Stanza

  let poem = {
    title: "Sailing to Byzantium",
    poet: "W. B. Yeats",
    year: 1928,
    stanzas: [stanza]
  } as Poem

  return (
    <div ref={ref} className="reader" data-layout={layout}>
      <article className="reader-text">
        <div className="text-block">
          <TitleBlock poem={poem} />
          <PoemBlock poem={poem} />
        </div>
      </article>
      {layout === "spread" ? (
        <Margin />
      ) : (
        <BottomSheet label="Notes">
          <p className="margin-empty">Notes will appear here.</p>
        </BottomSheet>
      )}
    </div>
  )
}