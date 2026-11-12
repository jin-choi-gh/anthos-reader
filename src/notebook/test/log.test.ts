import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { clearNotebook, notebookKey, readNotebook, writeNotebook } from "../log"
import type { NotebookEvent, NoteId } from "../types"

const a = "a" as NoteId

const events: NotebookEvent[] = [
  {
    kind: "noted",
    id: a,
    at: 1_000,
    anchor: { kind: "whole", text: "dickinson" },
    body: "A worm.",
    from: { practice: "first-reading", stage: 0, step: 2 },
  },
  { kind: "revised", id: a, at: 2_000, body: "A worm, raw." },
  {
    kind: "noted",
    id: "b" as NoteId,
    at: 3_000,
    anchor: { kind: "whole", text: "dickinson" },
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
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("the notebook in storage", () => {
  it("keeps one notebook per text, under a key that names the events' shape", () => {
    expect(notebookKey("dickinson")).toBe("anthos.v1.notebook.dickinson")
  })

  it("reads back what it kept, and nothing for another text", () => {
    expect(writeNotebook("dickinson", events)).toBe(true)
    expect(readNotebook("dickinson")).toEqual(events)
    expect(readNotebook("keats")).toEqual([])
  })

  it("forgets a notebook", () => {
    writeNotebook("dickinson", events)
    clearNotebook("dickinson")
    expect(readNotebook("dickinson")).toEqual([])
  })

  it("leaves out entries that are not events, and keeps those that are", () => {
    const strays = [
      null,
      { kind: "noted", id: "c", at: 0, body: "No anchor.", from: null },
      {
        kind: "noted",
        id: "c",
        at: 0,
        anchor: { kind: "passage" },
        body: "A kind not known yet.",
        from: null,
      },
      {
        kind: "noted",
        id: "c",
        at: 0,
        anchor: { kind: "whole", text: "d" },
        body: "x",
        from: { stage: 0 },
      },
      { kind: "revised", id: "", at: 0, body: "No id." },
      { kind: "revised", id: "a", body: "No time." },
      { kind: "erased", id: "a", at: 0 },
    ]
    stored.set(notebookKey("dickinson"), JSON.stringify([events[0], ...strays, events[1]]))
    expect(readNotebook("dickinson")).toEqual([events[0], events[1]])
  })
})
