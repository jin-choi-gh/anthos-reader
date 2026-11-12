import { describe, expect, it } from "vitest"
import { eventsOfMove, ruling, standingOf } from "../step"
import type { Practice, Step } from "../../practice/types"
import type { Day } from "../../clock/clock"
import type { NoteId, ReaderNote } from "../../notebook/types"
import type { Event, Standing } from "../types"

/** Where a screening stands: at a position, with when the next stage opens and where it holds. */
const standing = (
  stage: number,
  step: number,
  opensOn: string | null = null,
  heldAt: number | null = null,
): Standing => ({ position: { stage, step }, opensOn, heldAt })

/** The fold, with nothing in the notebook. */
const replay = (practice: Practice, log: Event[], today: Day) =>
  standingOf(practice, log, [], today)

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
    expect(replay(practice, [], "2026-11-10")).toEqual(standing(0, 0))
  })

  it("is at the step last visited", () => {
    const log = [visited(0, 1), visited(0, 0), visited(0, 1)]
    expect(replay(practice, log, "2026-11-10")).toEqual(standing(0, 1))
  })

  it("can be at the rest", () => {
    expect(replay(practice, [visited(0, 2)], "2026-11-10")).toEqual(standing(0, 2))
  })
})

describe("step: between stages", () => {
  const finishedFirst = [visited(0, 1), visited(0, 2), finished(0, "2026-11-10")]

  it("waits for the next day after a stage is finished", () => {
    expect(replay(practice, finishedFirst, "2026-11-10")).toEqual(standing(0, 2, "2026-11-11"))
  })

  it("opens the next stage, at its first step, on the next day", () => {
    expect(replay(practice, finishedFirst, "2026-11-11")).toEqual(standing(1, 0))
    expect(replay(practice, finishedFirst, "2026-12-25")).toEqual(standing(1, 0))
  })

  it("lets the reader go back while waiting, without moving the day", () => {
    const log = [...finishedFirst, visited(0, 0), visited(0, 2), finished(0, "2026-11-11")]
    expect(replay(practice, log, "2026-11-10")).toEqual(standing(0, 2, "2026-11-11"))
    expect(replay(practice, [...finishedFirst, visited(0, 0)], "2026-11-10")).toEqual(
      standing(0, 0, "2026-11-11"),
    )
  })

  it("follows the second stage's visits once it is open", () => {
    const log = [...finishedFirst, visited(1, 1)]
    expect(replay(practice, log, "2026-11-11")).toEqual(standing(1, 1))
  })

  it("opens the final stage as soon as the last stage is finished", () => {
    const log = [...finishedFirst, visited(1, 2), finished(1, "2026-11-11")]
    expect(replay(practice, log, "2026-11-11")).toEqual(standing(2, 0))
  })

  it("opens the final stage at once for a practice with no stages", () => {
    const empty = { ...practice, stages: [] }
    expect(replay(empty, [], "2026-11-10")).toEqual(standing(0, 0))
  })
})

describe("step: events that do not count", () => {
  it("ignores a stage finished on a day after today", () => {
    const log = [finished(0, "2026-11-12")]
    expect(replay(practice, log, "2026-11-11")).toEqual(standing(0, 0))
  })

  it("ignores a stage finished on a day before it opened", () => {
    const log = [finished(0, "2026-11-10"), finished(1, "2026-11-10")]
    expect(replay(practice, log, "2026-11-11")).toEqual(standing(1, 0))
  })

  it("ignores visits to steps that are not there", () => {
    for (const bad of [-1, 3, 1.5]) {
      const log = [visited(0, 1), visited(0, bad)]
      expect(replay(practice, log, "2026-11-10").position.step).toBe(1)
    }
  })

  it("ignores a stage's events logged before the stage before it was finished", () => {
    const log = [visited(1, 1), finished(1, "2026-11-11"), finished(0, "2026-11-10")]
    expect(replay(practice, log, "2026-11-11")).toEqual(standing(1, 0))
  })
})

describe("ruling", () => {
  const open = standing(0, 0)
  const waiting = standing(0, 2, "2026-11-11")

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
    const atRestUnfinished = standing(0, 2)
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
    const final = standing(2, 0)
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
  const open = standing(0, 0)

  it("records a visit to another step of the stage", () => {
    expect(eventsOfMove(practice, open, 1, at, "2026-11-10")).toEqual([
      { kind: "visited", stage: 0, step: 1, at },
    ])
  })

  it("records nothing for a move to where the reader is", () => {
    expect(eventsOfMove(practice, open, 0, at, "2026-11-10")).toEqual([])
  })

  it("finishes the stage, today, the first time the rest is reached", () => {
    expect(eventsOfMove(practice, standing(0, 1), 2, at, "2026-11-10")).toEqual([
      { kind: "visited", stage: 0, step: 2, at },
      { kind: "finished", stage: 0, at, day: "2026-11-10" },
    ])
  })

  it("only records the visit when the stage is already finished", () => {
    const waiting = standing(0, 0, "2026-11-11")
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
    const final = standing(2, 0)
    expect(eventsOfMove(practice, final, 1, at, "2026-11-10")).toEqual([])
  })

  it("agrees with step: a walk through both stages, fed back into the log", () => {
    const log: Event[] = []
    const walk = (target: number, today: Day) => {
      log.push(...eventsOfMove(practice, replay(practice, log, today), target, at, today))
      return replay(practice, log, today)
    }

    expect(walk(1, "2026-11-10")).toEqual(standing(0, 1))
    expect(walk(2, "2026-11-10")).toEqual(standing(0, 2, "2026-11-11"))
    expect(walk(0, "2026-11-10")).toEqual(standing(0, 0, "2026-11-11"))
    expect(walk(2, "2026-11-10")).toEqual(standing(0, 2, "2026-11-11"))
    expect(replay(practice, log, "2026-11-11")).toEqual(standing(1, 0))
    expect(walk(2, "2026-11-11")).toEqual(standing(2, 0))
    expect(log.filter((event) => event.kind === "finished")).toHaveLength(2)
  })
})

describe("the law: a step that asks for writing holds the reader until they have written", () => {
  const respond: Step = { direction: "respond", prose: ["What does the bird eat?"] }
  /** Two stages; the first is consider, respond, consider, respond, with its rest at step 4. */
  const asking: Practice = {
    ...practice,
    stages: [
      { name: "First", steps: [consider("a"), respond, consider("b"), respond] },
      { name: "Second", steps: [consider("c")] },
    ],
  }
  /** A note in the notebook, written on a step of the first stage. */
  const written = (step: number): ReaderNote => ({
    id: `note-${step}` as NoteId,
    anchor: { kind: "whole", text: "fixture" },
    body: "Worms.",
    from: { practice: asking.id, stage: 0, step },
    writtenAt: 0,
    revisedAt: null,
  })

  it("is held at the first step that asks and has nothing written", () => {
    expect(standingOf(asking, [], [], "2026-11-10").heldAt).toBe(1)
    expect(standingOf(asking, [], [written(1)], "2026-11-10").heldAt).toBe(3)
    expect(standingOf(asking, [], [written(1), written(3)], "2026-11-10").heldAt).toBeNull()
  })

  it("counts only notes from this practice, stage and step", () => {
    const elsewhere = [
      { ...written(1), from: { practice: "other", stage: 0, step: 1 } },
      { ...written(1), from: { practice: asking.id, stage: 1, step: 1 } },
      { ...written(1), from: null },
    ]
    expect(standingOf(asking, [], elsewhere, "2026-11-10").heldAt).toBe(1)
  })

  it("never holds a stage that is finished, even if its note is later withdrawn", () => {
    const log = [visited(0, 4), finished(0, "2026-11-10")]
    expect(standingOf(asking, log, [], "2026-11-10")).toEqual(standing(0, 4, "2026-11-11"))
  })

  it("refuses to pull past the held step, with its reason; up to it, and back, are allowed", () => {
    const held = standing(0, 1, null, 1)
    expect(ruling(asking, held, 2)).toEqual({ allowed: false, reason: { kind: "unanswered" } })
    expect(ruling(asking, held, 4)).toEqual({ allowed: false, reason: { kind: "unanswered" } })
    expect(ruling(asking, held, 1)).toEqual({ allowed: true, to: 1 })
    expect(ruling(asking, held, 0)).toEqual({ allowed: true, to: 0 })
  })

  it("lets the reader on once the note is written", () => {
    const log: Event[] = [visited(0, 1)]
    const before = standingOf(asking, log, [], "2026-11-10")
    expect(() => eventsOfMove(asking, before, 2, 0, "2026-11-10")).toThrow(/unanswered/)
    const after = standingOf(asking, log, [written(1)], "2026-11-10")
    expect(eventsOfMove(asking, after, 2, 0, "2026-11-10")).toEqual([visited(0, 2)])
  })
})
