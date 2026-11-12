import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { advance, clockOffset, dayOf, now, resetClock, today } from "../clock"

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

/** An instant by this machine's local time, so the tests hold in any time zone. Months from 1. */
const local = (year: number, month: number, date: number, hour: number, minute = 0) =>
  new Date(year, month - 1, date, hour, minute).getTime()

describe("dayOf", () => {
  it("starts a day at 04:00, local time", () => {
    expect(dayOf(local(2026, 11, 11, 3, 59))).toBe("2026-11-10")
    expect(dayOf(local(2026, 11, 11, 4, 0))).toBe("2026-11-11")
    expect(dayOf(local(2026, 11, 11, 23, 59))).toBe("2026-11-11")
  })

  it("counts the small hours as the day before, across years and leap days", () => {
    expect(dayOf(local(2027, 1, 1, 1))).toBe("2026-12-31")
    expect(dayOf(local(2028, 3, 1, 2))).toBe("2028-02-29")
  })
})

describe("now, today and the dev offset", () => {
  const real = local(2026, 11, 10, 12)
  let stored: Map<string, string>
  let clockEvents: number

  beforeEach(() => {
    stored = new Map()
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => stored.get(key) ?? null,
      setItem: (key: string, value: string) => void stored.set(key, value),
      removeItem: (key: string) => void stored.delete(key),
    })
    const target = new EventTarget()
    clockEvents = 0
    target.addEventListener("anthos-clock", () => clockEvents++)
    vi.stubGlobal("window", target)
    vi.spyOn(Date, "now").mockReturnValue(real)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("is the real time when nothing has moved it", () => {
    expect(now()).toBe(real)
    expect(today()).toBe("2026-11-10")
    expect(clockOffset()).toBe(0)
  })

  it("says how far it is ahead, and nothing once reset", () => {
    advance(DAY)
    advance(HOUR)
    expect(clockOffset()).toBe(DAY + HOUR)
    resetClock()
    expect(clockOffset()).toBe(0)
  })

  it("moves forward by what advance adds, and says so", () => {
    advance(DAY)
    expect(now()).toBe(real + DAY)
    expect(today()).toBe("2026-11-11")
    advance(HOUR)
    expect(now()).toBe(real + DAY + HOUR)
    expect(clockEvents).toBe(2)
  })

  it("ignores moves back and moves of nothing", () => {
    advance(DAY)
    advance(-HOUR)
    advance(0)
    expect(now()).toBe(real + DAY)
    expect(clockEvents).toBe(1)
  })

  it("keeps the offset across loads, in storage", () => {
    advance(DAY)
    expect(stored.get("anthos.dev.clockOffset")).toBe(String(DAY))
  })

  it("goes back to the real time on reset", () => {
    advance(DAY)
    resetClock()
    expect(now()).toBe(real)
    expect(stored.has("anthos.dev.clockOffset")).toBe(false)
    expect(clockEvents).toBe(2)
  })

  it("ignores an offset in storage that is not a positive number", () => {
    for (const value of ["-5", "soon", "Infinity"]) {
      stored.set("anthos.dev.clockOffset", value)
      expect(now()).toBe(real)
    }
  })

  it("is the real time when storage is off", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("storage is off")
      },
      setItem: () => {
        throw new Error("storage is off")
      },
      removeItem: () => {
        throw new Error("storage is off")
      },
    })
    advance(DAY)
    expect(now()).toBe(real)
  })
})
