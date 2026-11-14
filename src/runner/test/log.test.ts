import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { appendLog, clearLog, logKey, readLog } from "../log"
import type { Practice } from "../../practice/types"
import type { Event } from "../types"

const practice: Practice = {
  id: "first-reading",
  title: "First reading",
  text: "dickinson",
  stages: [],
}

const log: Event[] = [
  { kind: "visited", stage: 0, step: 1, at: 1_000 },
  { kind: "finished", stage: 0, at: 2_000, day: "2026-11-10" },
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

describe("saving and reading a run", () => {
  it("keeps one log per practice and text", () => {
    expect(logKey(practice)).toBe("anthos.log.first-reading.dickinson")
  })

  it("reads back what it saved", () => {
    expect(appendLog(practice, log)).toBe(true)
    expect(readLog(practice)).toEqual(log)
  })

  it("reads an empty log when nothing is saved", () => {
    expect(readLog(practice)).toEqual([])
  })

  it("keeps the runs of different practices on one text apart", () => {
    const other = { ...practice, id: "slow-reading" }
    appendLog(practice, log)
    expect(readLog(other)).toEqual([])
  })

  it("adds to what another tab kept, rather than writing over it", () => {
    appendLog(practice, [log[0]!]) // as if from another tab
    appendLog(practice, [log[1]!])
    expect(readLog(practice)).toEqual(log)
  })

  it("forgets a run", () => {
    appendLog(practice, log)
    clearLog(practice)
    expect(readLog(practice)).toEqual([])
    expect(stored.size).toBe(0)
  })

  it("forgets nothing outside development", () => {
    vi.stubEnv("DEV", false)
    appendLog(practice, log)
    clearLog(practice)
    expect(readLog(practice)).toEqual(log)
  })
})

describe("a damaged log", () => {
  it("reads as empty when it is not JSON, or not a list", () => {
    for (const saved of ["{not json", '{"kind":"visited"}', "null", "3"]) {
      stored.set(logKey(practice), saved)
      expect(readLog(practice)).toEqual([])
    }
  })

  it("leaves out entries that are not events, and keeps those that are", () => {
    const strays = [
      null,
      "visited",
      { kind: "jumped", stage: 0, at: 0 }, // a kind this reader does not know
      { kind: "visited", stage: 0, step: 1 }, // no time
      { kind: "visited", stage: "0", step: 1, at: 0 }, // a stage that is not a number
      { kind: "visited", stage: 0, step: 1.5, at: 0 }, // half a step
      { kind: "finished", stage: 0, at: 0, day: "Tuesday" }, // not a date
      { kind: "finished", stage: 0, at: 0 }, // no day
      { kind: "responded", stage: 0, step: 0, text: "A bird.", at: 0 }, // an older kind, now kept in the notebook
    ]
    stored.set(logKey(practice), JSON.stringify([log[0], ...strays, log[1]]))
    expect(readLog(practice)).toEqual(log)
  })
})

describe("storage that is off", () => {
  beforeEach(() => {
    const off = () => {
      throw new Error("storage is off")
    }
    vi.stubGlobal("localStorage", { getItem: off, setItem: off, removeItem: off })
  })

  it("reads an empty log, says a save failed, and forgets without complaint", () => {
    expect(readLog(practice)).toEqual([])
    expect(appendLog(practice, log)).toBe(false)
    expect(() => clearLog(practice)).not.toThrow()
  })
})
