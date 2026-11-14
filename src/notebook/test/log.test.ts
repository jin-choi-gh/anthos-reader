import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { appendNotebook, clearNotebook, notebookKey, readNotebook } from "../log"
import type { Fingerprint } from "../../material/types"
import type { NotebookEvent, NoteId } from "../types"

const a = "a" as NoteId
const whole = { start: { line: 0, offset: 0 }, end: { line: 19, offset: 29 } }
/** What every note here is about, and the lines it was written on. */
const about = { targets: [whole], tags: [], fingerprint: "f" as Fingerprint }

const events: NotebookEvent[] = [
  {
    kind: "noted",
    id: a,
    at: 1_000,
    ...about,
    body: "A worm.",
    from: { practice: "first-reading", stage: 0, step: 2 },
  },
  { kind: "revised", id: a, at: 2_000, body: "A worm, raw." },
  {
    kind: "noted",
    id: "b" as NoteId,
    at: 3_000,
    ...about,
    body: "Beads.",
    from: null,
  },
  { kind: "withdrawn", id: a, at: 4_000 },
]

let stored: Map<string, string>

beforeEach(() => {
  stored = new Map()
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => stored.get(key) ?? null,
    setItem: (key: string, value: string) => void stored.set(key, value),
    removeItem: (key: string) => void stored.delete(key),
  })
  vi.stubGlobal("window", new EventTarget())
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe("the notebook in storage", () => {
  it("keeps one notebook per text, under a key that names the events' shape", () => {
    expect(notebookKey("dickinson")).toBe("anthos.v1.notebook.dickinson")
  })

  it("reads back what it kept, and nothing for another text", () => {
    expect(appendNotebook("dickinson", events)).toBe(true)
    expect(readNotebook("dickinson")).toEqual(events)
    expect(readNotebook("keats")).toEqual([])
  })

  it("adds to what another tab kept, rather than writing over it", () => {
    appendNotebook("dickinson", [events[0]!]) // as if from another tab
    appendNotebook("dickinson", [events[2]!])
    expect(readNotebook("dickinson")).toEqual([events[0], events[2]])
  })

  it("forgets a notebook", () => {
    appendNotebook("dickinson", events)
    clearNotebook("dickinson")
    expect(readNotebook("dickinson")).toEqual([])
  })

  it("forgets nothing outside development: the notebook is kept for good", () => {
    vi.stubEnv("DEV", false)
    appendNotebook("dickinson", events)
    clearNotebook("dickinson")
    expect(readNotebook("dickinson")).toEqual(events)
  })

  it("leaves out entries that are not events, and keeps those that are", () => {
    const strays = [
      null,
      {
        kind: "noted",
        id: "c",
        at: 0,
        ...about,
        targets: undefined,
        body: "No targets.",
        from: null,
      },
      { kind: "noted", id: "c", at: 0, ...about, targets: [], body: "About nothing.", from: null },
      {
        kind: "noted",
        id: "c",
        at: 0,
        ...about,
        targets: [{ start: { line: 0 }, end: { line: 1, offset: 3 } }],
        body: "A position with no offset.",
        from: null,
      },
      {
        kind: "noted",
        id: "c",
        at: 0,
        ...about,
        targets: [{ start: { line: -1, offset: 0 }, end: { line: 1, offset: 3 } }],
        body: "A line before the first.",
        from: null,
      },
      {
        kind: "noted",
        id: "c",
        at: 0,
        ...about,
        tags: [1],
        body: "A tag that is no word.",
        from: null,
      },
      {
        kind: "noted",
        id: "c",
        at: 0,
        ...about,
        fingerprint: 7,
        body: "No fingerprint.",
        from: null,
      },
      { kind: "noted", id: "c", at: 0, ...about, body: "x", from: { stage: 0 } },
      {
        kind: "noted",
        id: "c",
        at: 0,
        anchor: { kind: "whole", text: "dickinson" },
        body: "A note of the older shape, with an anchor.",
        from: null,
      },
      { kind: "revised", id: "", at: 0, body: "No id." },
      { kind: "revised", id: "a", body: "No time." },
      { kind: "erased", id: "a", at: 0 },
    ]
    stored.set(notebookKey("dickinson"), JSON.stringify([events[0], ...strays, events[1]]))
    expect(readNotebook("dickinson")).toEqual([events[0], events[1]])
  })
})
