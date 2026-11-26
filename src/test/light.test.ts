import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { chooseLight, isLight, LIGHT_KEY, lightIn, openLight } from "../light"

let stored: Map<string, string>
let dataset: { light?: string }
let onStorage: (event: { key: string | null }) => void

beforeEach(() => {
  stored = new Map()
  dataset = {}
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => stored.get(key) ?? null,
    setItem: (key: string, value: string) => void stored.set(key, value),
  })
  vi.stubGlobal("document", { documentElement: { dataset } })
  vi.stubGlobal("window", {
    addEventListener: (_: string, listener: typeof onStorage) => {
      onStorage = listener
    },
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("the light", () => {
  it("is the system's until the reader chooses, and then the reader's", () => {
    expect(lightIn(null, true)).toBe("dark")
    expect(lightIn(null, false)).toBe("light")
    expect(lightIn("light", true)).toBe("light")
    expect(lightIn("dark", false)).toBe("dark")
  })

  it("is light or dark, and nothing else", () => {
    expect(["light", "dark"].every(isLight)).toBe(true)
    expect(["lamp", "", null, true, {}].some(isLight)).toBe(false)
  })
})

describe("a choice of light", () => {
  it("leaves the document unmarked when none is kept, or what is kept is not a light", () => {
    openLight()
    expect(dataset.light).toBeUndefined()
    stored.set(LIGHT_KEY, JSON.stringify("lamp"))
    openLight()
    expect(dataset.light).toBeUndefined()
  })

  it("marks the document, and is taken up again when the app next opens", () => {
    openLight()
    chooseLight("light")
    expect(dataset.light).toBe("light")
    delete dataset.light
    openLight()
    expect(dataset.light).toBe("light")
  })

  it("overwrites the choice before it", () => {
    chooseLight("light")
    chooseLight("dark")
    expect(dataset.light).toBe("dark")
    expect(stored.get(LIGHT_KEY)).toBe(JSON.stringify("dark"))
  })

  it("made in another tab is taken up here, and so is clearing it", () => {
    openLight()
    stored.set(LIGHT_KEY, JSON.stringify("dark"))
    onStorage({ key: "something.else" })
    expect(dataset.light).toBeUndefined()
    onStorage({ key: LIGHT_KEY })
    expect(dataset.light).toBe("dark")
    stored.clear()
    onStorage({ key: null })
    expect(dataset.light).toBeUndefined()
  })

  it("still holds until the page is left when storage is off", () => {
    const off = () => {
      throw new Error("storage is off")
    }
    vi.stubGlobal("localStorage", { getItem: off, setItem: off })
    openLight()
    chooseLight("dark")
    expect(dataset.light).toBe("dark")
  })
})
