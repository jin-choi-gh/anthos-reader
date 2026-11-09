import { loadTextualComplex, textualComplexFiles } from "../loom/load"
import { readerHref } from "../route"
import { useLoaded } from "../useLoaded"
import "./library.css"

/** One poem in the library: its file in text-data/, and what its metadata says it is. */
interface Entry {
  file: string
  title: string // the metadata's title, or the file name when there is none
  author: string | null
}

/** Every textual complex in text-data/, by title and poet, each a link to read it. */
export function Library() {
  const { value: entries, error } = useLoaded("library", loadEntries)

  return (
    <main className="library">
      <h1 className="library-heading">Library</h1>
      {error !== null ? (
        <p className="library-message">{error}</p>
      ) : entries === null ? (
        <p className="library-message">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="library-message">No poems in text-data/.</p>
      ) : (
        <ul className="library-list">
          {entries.map((entry) => (
            <li key={entry.file}>
              <a className="library-entry" href={readerHref(entry.file)}>
                <span className="library-title">{entry.title}</span>
                {entry.author !== null && <span className="library-poet">{entry.author}</span>}
              </a>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

function loadEntries(): Promise<Entry[]> {
  return Promise.all(textualComplexFiles().map(entryOf))
}

async function entryOf(file: string): Promise<Entry> {
  const { metadata } = await loadTextualComplex(file)
  return { file, title: metadata.title ?? file, author: metadata.author }
}
