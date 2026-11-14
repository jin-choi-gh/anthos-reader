import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { clearEvents, whenForgotten } from "../log"

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

describe("forgetting a log", () => {
  it("removes the log under its key, and no other", () => {
    clearEvents("a")
    expect([...stored.keys()]).toEqual(["b"])
  })

  it("tells whoever listens on its key, and only them", () => {
    const onA = vi.fn()
    const onB = vi.fn()
    whenForgotten("a", onA)
    whenForgotten("b", onB)
    clearEvents("a")
    expect(onA).toHaveBeenCalledOnce()
    expect(onB).not.toHaveBeenCalled()
  })

  it("stops telling a listener once it has stopped listening", () => {
    const onA = vi.fn()
    const stop = whenForgotten("a", onA)
    stop()
    clearEvents("a")
    expect(onA).not.toHaveBeenCalled()
  })

  it("still tells them when storage is off: an open copy must be emptied all the same", () => {
    const off = () => {
      throw new Error("storage is off")
    }
    vi.stubGlobal("localStorage", { getItem: off, setItem: off, removeItem: off })
    const onA = vi.fn()
    whenForgotten("a", onA)
    expect(() => clearEvents("a")).not.toThrow()
    expect(onA).toHaveBeenCalledOnce()
  })
})
