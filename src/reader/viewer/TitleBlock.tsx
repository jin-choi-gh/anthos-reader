import type { Poem } from "../../material/types"

export function TitleBlock({ poem }: { poem: Poem }) {
  return (
    <header className="title-block">
      <h1 className="title">{poem.title}</h1>
      <p className="poet">{poem.author}</p>
    </header>
  )
}
