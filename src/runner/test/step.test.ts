import { describe, expect, it } from "vitest"
import { eventOfResponse, eventsOfMove, nextDay, responseOf, ruling, step } from "../step"
import type { Practice, Step } from "../../practice/types"
import type { Day, Event } from "../types"

const consider = (note: string): Step => ({
  direction: "consider",
  note,
  prose: [`Consider ${note}.`],
})

/** Two stages of two steps each: the rests are at step 2. */
const practice: Practice = {
  id: "test",
  title: "Test",
  text: "fixture",
  stages: [
    { name: "First", steps: [consider("a"), consider("b")] },
    { name: "Second", steps: [consider("c"), consider("d")] },
  ],
}

const visited = (stage: number, step: number): Event => ({ kind: "visited", stage, step, at: 0 })
const finished = (stage: number, day: Day): Event => ({ kind: "finished", stage, at: 0, day })

describe("step: within a stage", () => {
  it("starts at the first step of the first stage", () => {
    expect(step(practice, [], "2026-11-10")).toEqual({ stage: 0, step: 0, opensOn: null })
  })

  it("is at the step last visited", () => {
    const log = [visited(0, 1), visited(0, 0), visited(0, 1)]
    expect(step(practice, log, "2026-11-10")).toEqual({ stage: 0, step: 1, opensOn: null })
  })

  it("can be at the rest", () => {
    expect(step(practice, [visited(0, 2)], "2026-11-10")).toEqual({
      stage: 0,
      step: 2,
      opensOn: null,
    })
  })
})

describe("step: between stages", () => {
  const finishedFirst = [visited(0, 1), visited(0, 2), finished(0, "2026-11-10")]

  it("waits for the next day after a stage is finished", () => {
    expect(step(practice, finishedFirst, "2026-11-10")).toEqual({
      stage: 0,
      step: 2,
      opensOn: "2026-11-11",
    })
  })

  it("opens the next stage, at its first step, on the next day", () => {
    expect(step(practice, finishedFirst, "2026-11-11")).toEqual({
      stage: 1,
      step: 0,
      opensOn: null,
    })
    expect(step(practice, finishedFirst, "2026-12-25")).toEqual({
      stage: 1,
      step: 0,
      opensOn: null,
    })
  })

  it("lets the reader go back while waiting, without moving the day", () => {
    const log = [...finishedFirst, visited(0, 0), visited(0, 2), finished(0, "2026-11-11")]
    expect(step(practice, log, "2026-11-10")).toEqual({ stage: 0, step: 2, opensOn: "2026-11-11" })
    expect(step(practice, [...finishedFirst, visited(0, 0)], "2026-11-10")).toEqual({
      stage: 0,
      step: 0,
      opensOn: "2026-11-11",
    })
  })

  it("follows the second stage's visits once it is open", () => {
    const log = [...finishedFirst, visited(1, 1)]
    expect(step(practice, log, "2026-11-11")).toEqual({ stage: 1, step: 1, opensOn: null })
  })

  it("opens the final stage as soon as the last stage is finished", () => {
    const log = [...finishedFirst, visited(1, 2), finished(1, "2026-11-11")]
    expect(step(practice, log, "2026-11-11")).toEqual({ stage: 2, step: 0, opensOn: null })
  })

  it("opens the final stage at once for a practice with no stages", () => {
    const empty = { ...practice, stages: [] }
    expect(step(empty, [], "2026-11-10")).toEqual({ stage: 0, step: 0, opensOn: null })
  })
})

describe("step: events that do not count", () => {
  it("ignores a stage finished on a day after today", () => {
    const log = [finished(0, "2026-11-12")]
    expect(step(practice, log, "2026-11-11")).toEqual({ stage: 0, step: 0, opensOn: null })
  })

  it("ignores a stage finished on a day before it opened", () => {
    const log = [finished(0, "2026-11-10"), finished(1, "2026-11-10")]
    expect(step(practice, log, "2026-11-11")).toEqual({ stage: 1, step: 0, opensOn: null })
  })

  it("ignores visits to steps that are not there", () => {
    for (const bad of [-1, 3, 1.5]) {
      const log = [visited(0, 1), visited(0, bad)]
      expect(step(practice, log, "2026-11-10").step).toBe(1)
    }
  })

  it("is not moved by a response: it neither visits a step nor finishes a stage", () => {
    const responded: Event = { kind: "responded", stage: 0, step: 0, text: "A bird.", at: 0 }
    const log = [visited(0, 1), responded]
    expect(step(practice, log, "2026-11-10")).toEqual({ stage: 0, step: 1, opensOn: null })
  })

  it("ignores a stage's events logged before the stage before it was finished", () => {
    const log = [visited(1, 1), finished(1, "2026-11-11"), finished(0, "2026-11-10")]
    expect(step(practice, log, "2026-11-11")).toEqual({ stage: 1, step: 0, opensOn: null })
  })
})

describe("nextDay", () => {
  it("gives the next calendar day, across months, years and leap days", () => {
    expect(nextDay("2026-11-10")).toBe("2026-11-11")
    expect(nextDay("2026-11-30")).toBe("2026-12-01")
    expect(nextDay("2026-12-31")).toBe("2027-01-01")
    expect(nextDay("2028-02-28")).toBe("2028-02-29")
    expect(nextDay("2028-02-29")).toBe("2028-03-01")
    expect(nextDay("2027-02-28")).toBe("2027-03-01")
  })
})

describe("ruling", () => {
  const open = { stage: 0, step: 0, opensOn: null }
  const waiting = { stage: 0, step: 2, opensOn: "2026-11-11" }

  it("allows any step of the stage, the rest included, and jumps between them", () => {
    for (const target of [0, 1, 2]) {
      expect(ruling(practice, open, target)).toEqual({ allowed: true, to: target })
      expect(ruling(practice, waiting, target)).toEqual({ allowed: true, to: target })
    }
  })

  it("refuses to go beyond the rest: the next stage is not open yet", () => {
    expect(ruling(practice, waiting, 3)).toEqual({
      allowed: false,
      reason: { kind: "waiting", opensOn: "2026-11-11" },
    })
  })

  it("refuses to go beyond the rest without a day, when the log left no valid finish", () => {
    const atRestUnfinished = { stage: 0, step: 2, opensOn: null }
    expect(ruling(practice, atRestUnfinished, 3)).toEqual({
      allowed: false,
      reason: { kind: "waiting", opensOn: null },
    })
  })

  it("refuses what is not a step", () => {
    for (const target of [-1, 1.5, Number.NaN]) {
      expect(ruling(practice, open, target)).toEqual({
        allowed: false,
        reason: { kind: "noSuchStep" },
      })
    }
  })

  it("refuses every move in the final stage", () => {
    const final = { stage: 2, step: 0, opensOn: null }
    for (const target of [-1, 0, 1, 3]) {
      expect(ruling(practice, final, target)).toEqual({
        allowed: false,
        reason: { kind: "finished" },
      })
    }
  })

  it("is the law eventsOfMove keeps: it throws, naming the reason, exactly when the ruling refuses", () => {
    for (const target of [-1, 0, 1, 1.5, 2, 3]) {
      const decision = ruling(practice, open, target)
      const move = () => eventsOfMove(practice, open, target, 1_000, "2026-11-10")
      if (decision.allowed) expect(move).not.toThrow()
      else expect(move).toThrow(new RegExp(decision.reason.kind))
    }
  })
})

describe("eventsOfMove", () => {
  const at = 1_000
  const open = { stage: 0, step: 0, opensOn: null }

  it("records a visit to another step of the stage", () => {
    expect(eventsOfMove(practice, open, 1, at, "2026-11-10")).toEqual([
      { kind: "visited", stage: 0, step: 1, at },
    ])
  })

  it("records nothing for a move to where the reader is", () => {
    expect(eventsOfMove(practice, open, 0, at, "2026-11-10")).toEqual([])
  })

  it("finishes the stage, today, the first time the rest is reached", () => {
    expect(eventsOfMove(practice, { ...open, step: 1 }, 2, at, "2026-11-10")).toEqual([
      { kind: "visited", stage: 0, step: 2, at },
      { kind: "finished", stage: 0, at, day: "2026-11-10" },
    ])
  })

  it("only records the visit when the stage is already finished", () => {
    const waiting = { stage: 0, step: 0, opensOn: "2026-11-11" }
    expect(eventsOfMove(practice, waiting, 2, at, "2026-11-10")).toEqual([
      { kind: "visited", stage: 0, step: 2, at },
    ])
  })

  it("refuses a step that is not in the stage", () => {
    for (const target of [-1, 3, 1.5]) {
      expect(() => eventsOfMove(practice, open, target, at, "2026-11-10")).toThrow(RangeError)
    }
  })

  it("records nothing in the final stage", () => {
    const final = { stage: 2, step: 0, opensOn: null }
    expect(eventsOfMove(practice, final, 1, at, "2026-11-10")).toEqual([])
  })

  it("agrees with step: a walk through both stages, fed back into the log", () => {
    const log: Event[] = []
    const walk = (target: number, today: Day) => {
      log.push(...eventsOfMove(practice, step(practice, log, today), target, at, today))
      return step(practice, log, today)
    }

    expect(walk(1, "2026-11-10")).toEqual({ stage: 0, step: 1, opensOn: null })
    expect(walk(2, "2026-11-10")).toEqual({ stage: 0, step: 2, opensOn: "2026-11-11" })
    expect(walk(0, "2026-11-10")).toEqual({ stage: 0, step: 0, opensOn: "2026-11-11" })
    expect(walk(2, "2026-11-10")).toEqual({ stage: 0, step: 2, opensOn: "2026-11-11" })
    expect(step(practice, log, "2026-11-11")).toEqual({ stage: 1, step: 0, opensOn: null })
    expect(walk(2, "2026-11-11")).toEqual({ stage: 2, step: 0, opensOn: null })
    expect(log.filter((event) => event.kind === "finished")).toHaveLength(2)
  })
})

describe("responses", () => {
  /** One stage: a consider step, then a respond step. The rest is at step 2. */
  const asking: Practice = {
    ...practice,
    stages: [
      {
        name: "First",
        steps: [consider("a"), { direction: "respond", prose: ["What does the bird eat?"] }],
      },
    ],
  }
  const at = 1_000
  const onRespond = { stage: 0, step: 1, opensOn: null }
  const responded = (stage: number, step: number, text: string): Event => ({
    kind: "responded",
    stage,
    step,
    text,
    at,
  })

  it("has no response on a step nobody has responded to", () => {
    expect(responseOf([], onRespond)).toBeNull()
    expect(responseOf([responded(0, 0, "Elsewhere.")], onRespond)).toBeNull()
    expect(responseOf([responded(1, 1, "Another stage.")], onRespond)).toBeNull()
  })

  it("is the latest response saved on the step", () => {
    const log = [responded(0, 1, "A worm."), visited(0, 0), responded(0, 1, "A worm, raw.")]
    expect(responseOf(log, onRespond)).toBe("A worm, raw.")
  })

  it("saves a response on a respond step", () => {
    expect(eventOfResponse(asking, onRespond, "A worm.", at)).toEqual(responded(0, 1, "A worm."))
  })

  it("refuses a response anywhere else: a consider step, the rest, the final stage", () => {
    for (const position of [
      { stage: 0, step: 0, opensOn: null },
      { stage: 0, step: 2, opensOn: null },
      { stage: 1, step: 0, opensOn: null },
    ]) {
      expect(() => eventOfResponse(asking, position, "A worm.", at)).toThrow(RangeError)
    }
  })

  it("agrees with responseOf: a saved response is read back", () => {
    const log = [eventOfResponse(asking, onRespond, "A worm.", at)]
    expect(responseOf(log, onRespond)).toBe("A worm.")
  })
})
