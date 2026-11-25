import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { clearValue, readValue, writeValue } from "../value"

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

const isWord = (value: unknown): value is { word: string } =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as { word?: unknown }).word === "string"

describe("a value kept under a key", () => {
  it("is read back as it was written, and overwritten by the next", () => {
    expect(writeValue("k", { word: "one" })).toBe(true)
    expect(readValue("k", isWord)).toEqual({ word: "one" })
    writeValue("k", { word: "two" })
    expect(readValue("k", isWord)).toEqual({ word: "two" })
  })

  it("is none when nothing is kept, or what is kept is not JSON or does not pass the guard", () => {
    expect(readValue("k", isWord)).toBeNull()
    stored.set("k", "{not json")
    expect(readValue("k", isWord)).toBeNull()
    stored.set("k", JSON.stringify({ word: 3 }))
    expect(readValue("k", isWord)).toBeNull()
  })

  it("is forgotten", () => {
    writeValue("k", { word: "one" })
    clearValue("k")
    expect(readValue("k", isWord)).toBeNull()
  })

  it("is none, and kept nowhere, when storage is off, and nothing throws", () => {
    const off = () => {
      throw new Error("storage is off")
    }
    vi.stubGlobal("localStorage", { getItem: off, setItem: off, removeItem: off })
    expect(writeValue("k", { word: "one" })).toBe(false)
    expect(readValue("k", isWord)).toBeNull()
    expect(() => clearValue("k")).not.toThrow()
  })
})
