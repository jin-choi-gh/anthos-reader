// import type { CSSProperties } from "react"
import type { Poem } from "./types"

export function PoemBlock({ poem }: { poem: Poem }) {
  return (
    <div className="poem">
      {poem.stanzas.map((stanza, i) => (
        <div className="stanza" key={i}>
          {stanza.lines.map((line) => (
            <div
              key={line.id}
              className="line"
              data-line-id={line.id}
              // style={{ '--indent': line.indent ?? 0 } as CSSProperties }
            >
              {line.number % 5 === 0 && (
                <span className="line-number" aria-hidden="true">
                  {line.number}
                </span>
              )}
              <span className="line-text">{line.text}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
