// import type { CSSProperties } from "react"
import type { Poem } from "./types"

export function PoemBlock({ poem }: { poem: Poem }) {
  let n = 0

  return (
    <div className="poem">
      {poem.stanzas.map((stanza, i) => (
        <div className="stanza" key={i}>
          {stanza.lines.map((line) =>  {
            n += 1
            return (
              <div
                key={line.id}
                className="line"
                data-line-id={line.id}
                // style={{ '--indent': line.indent ?? 0 } as CSSProperties }
              >
                {n % 5 === 0 && (
                  <span className="line-number" aria-hidden="true">
                    {n}
                  </span>
                )}
                <span className="line-text">{line.text}</span>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}