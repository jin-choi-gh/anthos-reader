import { loadTextualComplex, textualComplexFiles } from "../loom/load"
import { toPoem } from "../loom/toPoem"
import { formHref, readerHref } from "../route"
import { useLoaded } from "../useLoaded"
import { Silhouette } from "./Silhouette"
import { longestOf, shapeOf, silhouetteOf, type Measure, type Shape } from "./silhouette"
import "./library.css"

/** One poem in the library: its file in text-data/, what its metadata says it is, its first line,
 * which it is listed by, and its shape. */
interface Entry {
  file: string
  title: string // the metadata's title, or the file name when there is none
  author: string | null
  firstLine: string // the first line with text, or the title when the poem has none
  lines: number
  shape: Shape
}

/** How every silhouette in the library is drawn, so that their shapes compare. */
const MEASURE: Measure = { width: 44, indent: 3, row: 2, gap: 1, stanzaGap: 4 }

/** Every textual complex in text-data/, as an index of first lines: each poem by its first line, its
 * poet and title, its silhouette and its length, a link to read it and, in development only, a link
 * to edit its practice in Form Practice. */
export function Library() {
  const { value: entries, error } = useLoaded("library", loadEntries)
  const longest = entries === null ? 0 : Math.max(0, ...entries.map((e) => longestOf(e.shape)))

  return (
    <main className="library">
      <header className="library-head">
        <h1 className="library-heading">
          Library
          {import.meta.env.DEV && (
            <span className="library-dev" title="Only in development">
              dev
            </span>
          )}
        </h1>
        {entries !== null && entries.length > 0 && (
          <p className="library-count">
            {entries.length === 1 ? "1 poem" : `${entries.length} poems`}, by first line
          </p>
        )}
      </header>
      {error !== null ? (
        <p className="library-message">{error}</p>
      ) : entries === null ? (
        <p className="library-message">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="library-message">No poems in text-data/.</p>
      ) : (
        <ul className="library-list">
          {entries.map((entry, i) => {
            const letter = initialOf(entry.firstLine)
            const shown = letter !== initialOf(entries[i - 1]?.firstLine ?? "") ? letter : ""
            const { bars, height } = silhouetteOf(entry.shape, longest, MEASURE)
            return (
              <li key={entry.file} className="library-item">
                <a className="library-entry" href={readerHref(entry.file)}>
                  <span className="library-letter" aria-hidden="true">
                    {shown}
                  </span>
                  <Silhouette bars={bars} width={MEASURE.width} height={height} row={MEASURE.row} />
                  <span className="library-words">
                    <span className="library-first">{entry.firstLine}</span>
                    <span className="library-poet">
                      {entry.author === null ? entry.title : `${entry.author} · ${entry.title}`}
                    </span>
                  </span>
                  <span className="library-facts">
                    {entry.lines === 1 ? "1 line" : `${entry.lines} lines`}
                  </span>
                </a>
                {import.meta.env.DEV && (
                  <a className="library-edit" href={formHref(entry.file)}>
                    Edit practice
                  </a>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}

/** The letter a first line is indexed under: its first letter, in capitals; empty when it has none. */
function initialOf(line: string): string {
  return /\p{L}/u.exec(line)?.[0]?.toLocaleUpperCase() ?? ""
}

const byFirstLine = new Intl.Collator(undefined, { sensitivity: "base" })

/** Every poem, in the order of an index of first lines. */
async function loadEntries(): Promise<Entry[]> {
  const entries = await Promise.all(textualComplexFiles().map(entryOf))
  return entries.sort((a, b) => byFirstLine.compare(a.firstLine, b.firstLine))
}

async function entryOf(file: string): Promise<Entry> {
  const textualComplex = await loadTextualComplex(file)
  const { metadata } = textualComplex
  const { stanzas } = toPoem(textualComplex)
  const title = metadata.title ?? file
  const lines = stanzas.flatMap((stanza) => stanza.lines)
  const first = lines.find((line) => line.text.trim() !== "")
  return {
    file,
    title,
    author: metadata.author,
    firstLine: first?.text ?? title,
    lines: lines.length,
    shape: shapeOf(stanzas),
  }
}
