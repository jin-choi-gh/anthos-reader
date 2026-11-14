import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { appendEvents, clearEvents, whenChanged } from "../log"

let stored: Map<string, string>

beforeEach(() => {
  stored = new Map([
    ["a", "[]"],
    ["b", "[]"],
  ])
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => stored.get(key) ?? null,
    setItem: (key: string, value: string) => void stored.set(key, value),
    removeItem: (key: string) => void stored.delete(key),
  })
  vi.stubGlobal("window", new EventTarget())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const storageOff = () => {
  const off = () => {
    throw new Error("storage is off")
  }
  vi.stubGlobal("localStorage", { getItem: off, setItem: off, removeItem: off })
}

describe("adding to a log", () => {
  it("adds after what is there, and keeps entries it cannot read", () => {
    stored.set("a", JSON.stringify([{ kind: "from-a-newer-reader" }]))
    expect(appendEvents("a", [{ kind: "noted" }])).toBe(true)
    expect(JSON.parse(stored.get("a") ?? "")).toEqual([
      { kind: "from-a-newer-reader" },
      { kind: "noted" },
    ])
  })

  it("starts a log where there is none", () => {
    appendEvents("c", [1, 2])
    expect(stored.get("c")).toBe("[1,2]")
  })

  it("starts a new log over a damaged one", () => {
    for (const damaged of ["{not json", '{"kind":"visited"}', "null"]) {
      stored.set("a", damaged)
      appendEvents("a", [1])
      expect(stored.get("a")).toBe("[1]")
    }
  })

  it("adds nothing, and says so, when storage is off", () => {
    storageOff()
    expect(appendEvents("a", [1])).toBe(false)
  })
})

describe("forgetting a log", () => {
  it("removes the log under its key, and no other", () => {
    clearEvents("a")
    expect([...stored.keys()]).toEqual(["b"])
  })

  it("tells whoever listens on its key, and only them", () => {
    const onA = vi.fn()
    const onB = vi.fn()
    whenChanged("a", onA)
    whenChanged("b", onB)
    clearEvents("a")
    expect(onA).toHaveBeenCalledOnce()
    expect(onB).not.toHaveBeenCalled()
  })

  it("stops telling a listener once it has stopped listening", () => {
    const onA = vi.fn()
    const stop = whenChanged("a", onA)
    stop()
    clearEvents("a")
    expect(onA).not.toHaveBeenCalled()
  })

  it("still tells them when storage is off: an open copy must be emptied all the same", () => {
    storageOff()
    const onA = vi.fn()
    whenChanged("a", onA)
    expect(() => clearEvents("a")).not.toThrow()
    expect(onA).toHaveBeenCalledOnce()
  })
})

describe("a log changed in another tab", () => {
  /** What the browser fires in every other tab when one changes storage. */
  const storageEvent = (key: string | null) => Object.assign(new Event("storage"), { key })

  it("tells whoever listens on its key, and everyone when all storage is cleared", () => {
    const onA = vi.fn()
    const onB = vi.fn()
    whenChanged("a", onA)
    whenChanged("b", onB)
    window.dispatchEvent(storageEvent("a"))
    expect(onA).toHaveBeenCalledOnce()
    expect(onB).not.toHaveBeenCalled()
    window.dispatchEvent(storageEvent(null))
    expect(onA).toHaveBeenCalledTimes(2)
    expect(onB).toHaveBeenCalledOnce()
  })

  it("stops telling a listener once it has stopped listening", () => {
    const onA = vi.fn()
    whenChanged("a", onA)()
    window.dispatchEvent(storageEvent("a"))
    expect(onA).not.toHaveBeenCalled()
  })
})
