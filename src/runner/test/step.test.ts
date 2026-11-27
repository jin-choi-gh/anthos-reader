import { describe, expect, it } from "vitest"
import {
  eventOfDisclosing,
  eventOfRestoring,
  eventsOfMove,
  isRestoring,
  ruling,
  standingOf,
} from "../step"
import { fingerprintOfPractice } from "../../practice/fingerprint"
import { REST } from "../../practice/parts"
import type { Practice, Parts } from "../../practice/types"
import { nextDay, type Day } from "../../clock/clock"
import type { NoteId, ReaderNote } from "../../notebook/types"
import type { Event, Standing } from "../types"
import type { Fingerprint } from "../../material/types"
import { practiceOf } from "../../practice/test/build"

/** Where a run stands: at a station, with when the next stage opens and where it holds. */
const standing = (
  stage: number,
  step: number,
  opensOn: string | null = null,
  heldAt: number | null = null,
): Standing => ({ station: { stage, step }, opensOn, heldAt })

/** The fold, with nothing in the notebook. */
const replay = (practice: Practice, log: Event[], today: Day) =>
  standingOf(practice, log, [], today)

/** A step that only says something. */
const say = (words: string): Parts => ({ ...REST, prose: [`Look at ${words}.`] })

/** Two stages of two steps each: the rests are at step 2. */
const practice = practiceOf({
  id: "test",
  title: "Test",
  text: "fixture",
  stages: [
    { name: "First", steps: [say("a"), say("b")] },
    { name: "Second", steps: [say("c"), say("d")] },
  ],
})

const visited = (stage: number, step: number): Event => ({ kind: "visited", stage, step, at: 0 })
/** A stage finished on a day, the next opening on the day after, as with a day's wait, unless
 * the event says otherwise. */
const finished = (stage: number, day: Day, opens: Day = nextDay(day)): Event => ({
  kind: "finished",
  stage,
  at: 0,
  day,
  opens,
})

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

  it("opens the next stage on the day its finished event fixed, whatever the days say now", () => {
    const slow = practiceOf({
      ...practice,
      stages: [
        { name: "First", steps: [say("a"), say("b")] },
        { name: "Second", steps: [say("c"), say("d")], days: 5 },
      ],
    })
    const log = [visited(0, 2), finished(0, "2026-11-10", "2026-11-13")]
    expect(replay(slow, log, "2026-11-12")).toEqual(standing(0, 2, "2026-11-13"))
    expect(replay(slow, log, "2026-11-13")).toEqual(standing(1, 0))
    // A stage already open stays open, however many days its stage is changed to wait
    expect(replay(slow, [...log, visited(1, 1)], "2026-11-13")).toEqual(standing(1, 1))
  })

  it("opens the final stage as soon as the last stage is finished", () => {
    const log = [...finishedFirst, visited(1, 2), finished(1, "2026-11-11")]
    expect(replay(practice, log, "2026-11-11")).toEqual(standing(2, 0))
  })

  it("stands in the last stage when the reader went back to it after finishing it", () => {
    const log = [visited(0, 2), finished(0, "2026-11-10"), visited(1, 2)]
    const done = [...log, finished(1, "2026-11-11", "2026-11-11")]
    expect(replay(practice, [...done, visited(1, 0)], "2026-11-11")).toEqual(
      standing(1, 0, "2026-11-11"),
    )
    expect(replay(practice, [...done, visited(1, 0), visited(1, 2)], "2026-11-11")).toEqual(
      standing(2, 0),
    )
  })

  it("counts no visit to the last stage from before it was finished as going back", () => {
    const log = [visited(0, 2), finished(0, "2026-11-10"), visited(1, 1)]
    const done = [...log, finished(1, "2026-11-11", "2026-11-11")]
    expect(replay(practice, done, "2026-11-11")).toEqual(standing(2, 0))
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
      expect(replay(practice, log, "2026-11-10").station.step).toBe(1)
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
      expect(ruling(practice, open, target)).toMatchObject({ allowed: true, to: target })
      expect(ruling(practice, waiting, target)).toMatchObject({ allowed: true, to: target })
    }
  })

  it("says a move finishes the stage only when it reaches the rest of a stage not yet finished", () => {
    expect(ruling(practice, open, 1)).toEqual({ allowed: true, to: 1, finishes: false })
    expect(ruling(practice, open, 2)).toEqual({ allowed: true, to: 2, finishes: true })
    expect(ruling(practice, standing(0, 1, "2026-11-11"), 2)).toEqual({
      allowed: true,
      to: 2,
      finishes: false,
    })
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

  it("counts the final stage's moves from the last stage's rest: back into the last stage", () => {
    const final = standing(2, 0)
    for (const target of [0, 1]) {
      expect(ruling(practice, final, target)).toEqual({
        allowed: true,
        to: target,
        finishes: false,
      })
    }
  })

  it("refuses a step past the final stage: the practice is over", () => {
    for (const here of [standing(2, 0), standing(1, 1, "2026-11-12")]) {
      expect(ruling(practice, here, 3)).toEqual({ allowed: false, reason: { kind: "finished" } })
    }
  })

  it("in the last stage, gone back to and finished already, lets the reader on to the rest, finishing nothing", () => {
    expect(ruling(practice, standing(1, 1, "2026-11-12"), 2)).toEqual({
      allowed: true,
      to: 2,
      finishes: false,
    })
  })

  it("refuses every move for a practice with no stages, which has nothing to go back to", () => {
    const empty = practiceOf({ ...practice, stages: [] })
    for (const target of [-1, 0, 1]) {
      expect(ruling(empty, standing(0, 0), target)).toEqual({
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
      { kind: "finished", stage: 0, at, day: "2026-11-10", opens: "2026-11-11" },
    ])
  })

  it("fixes the day the next stage opens by its days, and the final stage's on the day itself", () => {
    const slow = practiceOf({
      ...practice,
      stages: [
        { name: "First", steps: [say("a")] },
        { name: "Second", steps: [say("b")], days: 3 },
      ],
    })
    expect(eventsOfMove(slow, standing(0, 0), 1, at, "2026-11-30")).toEqual([
      { kind: "visited", stage: 0, step: 1, at },
      { kind: "finished", stage: 0, at, day: "2026-11-30", opens: "2026-12-03" },
    ])
    expect(eventsOfMove(slow, standing(1, 0), 1, at, "2026-12-03")).toEqual([
      { kind: "visited", stage: 1, step: 1, at },
      { kind: "finished", stage: 1, at, day: "2026-12-03", opens: "2026-12-03" },
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

  it("records a step back from the final stage as a visit in the last stage, finishing nothing", () => {
    const final = standing(2, 0)
    expect(eventsOfMove(practice, final, 1, at, "2026-11-10")).toEqual([
      { kind: "visited", stage: 1, step: 1, at },
    ])
  })

  it("records nothing for a move from the final stage to the last stage's rest, where it stands", () => {
    expect(eventsOfMove(practice, standing(2, 0), 2, at, "2026-11-10")).toEqual([])
  })

  it("records only the visit when the reader goes on to the rest of the last stage, finished already", () => {
    expect(eventsOfMove(practice, standing(1, 1, "2026-11-11"), 2, at, "2026-11-12")).toEqual([
      { kind: "visited", stage: 1, step: 2, at },
    ])
  })

  it("refuses a step past the final stage", () => {
    expect(() => eventsOfMove(practice, standing(2, 0), 3, at, "2026-11-10")).toThrow(/finished/)
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

  it("agrees with step: back from the final stage into the last, and on to the final stage again", () => {
    const log: Event[] = [visited(0, 2), finished(0, "2026-11-10"), visited(1, 2)]
    log.push(finished(1, "2026-11-11", "2026-11-11"))
    const walk = (target: number, today: Day) => {
      log.push(...eventsOfMove(practice, replay(practice, log, today), target, at, today))
      return replay(practice, log, today)
    }

    expect(replay(practice, log, "2026-11-11")).toEqual(standing(2, 0))
    expect(walk(1, "2026-11-11")).toEqual(standing(1, 1, "2026-11-11"))
    expect(walk(0, "2026-11-11")).toEqual(standing(1, 0, "2026-11-11"))
    // Days later the reader is still where they went back to
    expect(replay(practice, log, "2026-11-20")).toEqual(standing(1, 0, "2026-11-11"))
    expect(walk(1, "2026-11-20")).toEqual(standing(1, 1, "2026-11-11"))
    expect(walk(2, "2026-11-20")).toEqual(standing(2, 0))
    expect(log.filter((event) => event.kind === "finished")).toHaveLength(2)
  })
})

describe("the law: a step that asks for writing holds the reader until they have written", () => {
  const askWhole: Parts = {
    ...REST,
    prose: ["What does the bird eat?"],
    writing: { target: "whole", tags: [], count: "one" },
  }
  /** Two stages; the first says, asks, says, asks, with its rest at step 4. */
  const asking = practiceOf({
    ...practice,
    stages: [
      { name: "First", steps: [say("a"), askWhole, say("b"), askWhole] },
      { name: "Second", steps: [say("c")] },
    ],
  })
  /** A note in the notebook, written on a step of the first stage. */
  const written = (step: number): ReaderNote => ({
    id: `note-${step}` as NoteId,
    targets: [{ start: { line: 0, offset: 0 }, end: { line: 1, offset: 30 } }],
    tags: [],
    fingerprint: "f" as Fingerprint,
    body: "Worms.",
    from: { practice: asking.id, fingerprint: fingerprintOfPractice(asking), stage: 0, step },
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
      {
        ...written(1),
        from: { practice: "other", fingerprint: fingerprintOfPractice(asking), stage: 0, step: 1 },
      },
      {
        ...written(1),
        from: {
          practice: asking.id,
          fingerprint: fingerprintOfPractice(asking),
          stage: 1,
          step: 1,
        },
      },
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
    expect(ruling(asking, held, 1)).toEqual({ allowed: true, to: 1, finishes: false })
    expect(ruling(asking, held, 0)).toEqual({ allowed: true, to: 0, finishes: false })
  })

  it("lets the reader on once the note is written", () => {
    const log: Event[] = [visited(0, 1)]
    const before = standingOf(asking, log, [], "2026-11-10")
    expect(() => eventsOfMove(asking, before, 2, 0, "2026-11-10")).toThrow(/unanswered/)
    const after = standingOf(asking, log, [written(1)], "2026-11-10")
    expect(eventsOfMove(asking, after, 2, 0, "2026-11-10")).toEqual([visited(0, 2)])
  })
})

describe("the law: a step asking for writing on chosen passages holds the reader as one on the whole poem does", () => {
  const askChosen: Parts = {
    ...REST,
    prose: ["Where does the bird change?"],
    writing: { target: "chosen", tags: [], count: "one" },
  }
  /** Writing on chosen passages first in the first stage, and twice in a row, last, in the last. */
  const askingChosen = practiceOf({
    ...practice,
    stages: [
      { name: "First", steps: [askChosen, say("a")] },
      { name: "Second", steps: [say("b"), askChosen, askChosen] },
    ],
  })
  /** A note written on a step of this practice, unless written somewhere else. */
  const written = (
    stage: number,
    step: number,
    from: ReaderNote["from"] = {
      practice: askingChosen.id,
      fingerprint: fingerprintOfPractice(askingChosen),
      stage,
      step,
    },
  ): ReaderNote => ({
    id: `note-${stage}-${step}` as NoteId,
    targets: [{ start: { line: 0, offset: 2 }, end: { line: 0, offset: 6 } }],
    tags: [],
    fingerprint: "f" as Fingerprint,
    body: "A bird.",
    from,
    writtenAt: 0,
    revisedAt: null,
  })

  it("is held at the first step of a stage until its note is written, then let on", () => {
    expect(standingOf(askingChosen, [], [], "2026-11-10").heldAt).toBe(0)
    expect(standingOf(askingChosen, [], [written(0, 0)], "2026-11-10").heldAt).toBeNull()
  })

  it("counts no note from annotate mode or another step", () => {
    const others = [
      written(0, 0, null),
      written(0, 0, {
        practice: askingChosen.id,
        fingerprint: fingerprintOfPractice(askingChosen),
        stage: 1,
        step: 1,
      }),
    ]
    expect(standingOf(askingChosen, [], others, "2026-11-10").heldAt).toBe(0)
  })

  it("holds at two steps asking for writing in a row, each in turn", () => {
    const log = [visited(0, 2), finished(0, "2026-11-10")]
    const day = "2026-11-11"
    expect(standingOf(askingChosen, log, [written(0, 0)], day).heldAt).toBe(1)
    expect(standingOf(askingChosen, log, [written(0, 0), written(1, 1)], day).heldAt).toBe(2)
    expect(
      standingOf(askingChosen, log, [written(0, 0), written(1, 1), written(1, 2)], day).heldAt,
    ).toBeNull()
  })

  it("last in the last stage, once written, leads on to the final stage", () => {
    const notes = [written(0, 0), written(1, 1), written(1, 2)]
    const log = [visited(0, 2), finished(0, "2026-11-10"), visited(1, 2)]
    const here = standingOf(askingChosen, log, notes, "2026-11-11")
    expect(here).toEqual(standing(1, 2))
    const moves = eventsOfMove(askingChosen, here, 3, 0, "2026-11-11")
    expect(standingOf(askingChosen, [...log, ...moves], notes, "2026-11-11")).toEqual(
      standing(2, 0),
    )
  })
})

describe("the law and versions of a practice", () => {
  const askWhole: Parts = {
    ...REST,
    prose: ["What does the bird eat?"],
    writing: { target: "whole", tags: [], count: "one" },
  }
  const recall: Parts = {
    ...REST,
    prose: ["Yesterday, you wrote:"],
    recall: { from: "stage", id: "stage-1" },
  }
  const versioned = practiceOf({
    ...practice,
    stages: [
      { name: "First", steps: [askWhole] },
      { name: "Second", steps: [recall, say("c")] },
    ],
  })
  const note = (fingerprint: string): ReaderNote => ({
    id: "n" as NoteId,
    targets: [{ start: { line: 0, offset: 0 }, end: { line: 1, offset: 30 } }],
    tags: [],
    fingerprint: "f" as Fingerprint,
    body: "Worms.",
    from: {
      practice: versioned.id,
      fingerprint: fingerprint as ReturnType<typeof fingerprintOfPractice>,
      stage: 0,
      step: 0,
    },
    writtenAt: 0,
    revisedAt: null,
  })

  it("holds the reader at a step whose only note was written on another version", () => {
    expect(standingOf(versioned, [], [note("00000000000000")], "2026-11-10").heldAt).toBe(0)
    expect(
      standingOf(versioned, [], [note(fingerprintOfPractice(versioned))], "2026-11-10").heldAt,
    ).toBeNull()
  })

  it("never holds the reader at a recall, which asks for nothing", () => {
    const log = [visited(0, 1), finished(0, "2026-11-10")]
    const here = standingOf(versioned, log, [note(fingerprintOfPractice(versioned))], "2026-11-11")
    expect(here).toEqual(standing(1, 0))
    expect(ruling(versioned, here, 1)).toEqual({ allowed: true, to: 1, finishes: false })
  })
})

describe("the law: a step that only says something asks for nothing, so it never holds the reader", () => {
  const sayOnly: Parts = { ...REST, prose: ["Read the poem through."] }
  const saying = practiceOf({
    ...practice,
    stages: [
      { name: "First", steps: [sayOnly, say("a")] },
      { name: "Second", steps: [sayOnly] },
    ],
  })

  it("is held nowhere, with nothing in the notebook", () => {
    expect(standingOf(saying, [], [], "2026-11-10").heldAt).toBeNull()
  })

  it("lets the reader on to the rest, which finishes the stage", () => {
    const here = standingOf(saying, [], [], "2026-11-10")
    expect(ruling(saying, here, 2)).toEqual({ allowed: true, to: 2, finishes: true })
    expect(eventsOfMove(saying, here, 2, 0, "2026-11-10")).toEqual([
      visited(0, 2),
      finished(0, "2026-11-10"),
    ])
  })
})

describe("the law: a step that restores holds the reader there until every gap is restored", () => {
  const restore = { of: "words", gaps: ["l1 Bird", "l1 Walk"] } as const
  const game: Parts = { ...REST, prose: ["Put them back."], restore }
  const ask: Parts = {
    ...REST,
    prose: ["Why?"],
    writing: { target: "whole", tags: [], count: "one" },
  }
  /** Stage 1: a, the game, c, its rest at 3; stage 2: d, its rest at 1. */
  const restoring = practiceOf({
    id: "restoring",
    title: "Restoring",
    text: "fixture",
    stages: [
      { name: "First", steps: [say("a"), game, say("c")] },
      { name: "Second", steps: [say("d")] },
    ],
  })
  const restored = (stage: number, step: number): Event => ({
    kind: "restored",
    stage,
    step,
    at: 0,
  })
  const today = "2026-11-10"
  const at = 1_000

  it("holds the reader at the game until the log has it restored", () => {
    expect(replay(restoring, [], today)).toEqual(standing(0, 0, null, 1))
    expect(replay(restoring, [visited(0, 1)], today)).toEqual(standing(0, 1, null, 1))
    expect(replay(restoring, [visited(0, 1), restored(0, 1)], today)).toEqual(standing(0, 1))
  })

  it("counts only the game's own restoring, not another step's", () => {
    const log = [visited(0, 1), restored(0, 0), restored(1, 1)]
    expect(replay(restoring, log, today).heldAt).toBe(1)
  })

  it("lets the reader come to the game, but not past it", () => {
    const before = standing(0, 0, null, 1)
    expect(ruling(restoring, before, 1)).toEqual({ allowed: true, to: 1, finishes: false })
    expect(ruling(restoring, before, 2)).toEqual({
      allowed: false,
      reason: { kind: "unanswered" },
    })
  })

  it("at the game, refuses every move away from it, back, on or a jump, as restoring", () => {
    const here = standing(0, 1, null, 1)
    for (const target of [-1, 0, 2, 3, 4]) {
      expect(ruling(restoring, here, target)).toEqual({
        allowed: false,
        reason: { kind: "restoring" },
      })
    }
    expect(() => eventsOfMove(restoring, here, 0, at, today)).toThrow(/restoring/)
  })

  it("once restored, lets the reader go back and on again", () => {
    const here = replay(restoring, [visited(0, 1), restored(0, 1)], today)
    expect(ruling(restoring, here, 0)).toEqual({ allowed: true, to: 0, finishes: false })
    expect(ruling(restoring, here, 2)).toEqual({ allowed: true, to: 2, finishes: false })
  })

  it("does not lock the reader at a step that asks for writing: only on is refused", () => {
    const writing = practiceOf({ ...restoring, stages: [{ name: "One", steps: [say("a"), ask] }] })
    const here = standing(0, 1, null, 1)
    expect(ruling(writing, here, 0)).toEqual({ allowed: true, to: 0, finishes: false })
    expect(ruling(writing, here, 2)).toEqual({ allowed: false, reason: { kind: "unanswered" } })
  })

  it("never holds the reader in a finished stage, gone back to from the final stage", () => {
    const last = practiceOf({ ...restoring, stages: [{ name: "Only", steps: [say("a"), game] }] })
    const log = [visited(0, 1), restored(0, 1), visited(0, 2), finished(0, today, today)]
    expect(replay(last, log, today)).toEqual(standing(1, 0))
    const back = [...log, ...eventsOfMove(last, replay(last, log, today), 1, at, today)]
    expect(replay(last, back, today)).toEqual(standing(0, 1, today))
    expect(ruling(last, replay(last, back, today), 0)).toMatchObject({ allowed: true })
  })

  it("walks: to the game, refused, restored, on to the rest, and back to look again", () => {
    const log: Event[] = []
    const walk = (target: number) => {
      log.push(...eventsOfMove(restoring, replay(restoring, log, today), target, at, today))
      return replay(restoring, log, today)
    }
    expect(walk(1)).toEqual(standing(0, 1, null, 1))
    expect(ruling(restoring, replay(restoring, log, today), 0).allowed).toBe(false)
    const event = eventOfRestoring(restoring, log, { stage: 0, step: 1 }, at)
    expect(event).toEqual({ kind: "restored", stage: 0, step: 1, at })
    log.push(event!)
    expect(walk(2)).toEqual(standing(0, 2))
    expect(walk(3)).toEqual(standing(0, 3, nextDay(today)))
    expect(walk(1)).toEqual(standing(0, 1, nextDay(today)))
    expect(walk(0)).toEqual(standing(0, 0, nextDay(today)))
  })

  describe("eventOfRestoring", () => {
    it("gives the step restored, once: nothing when the log has it already", () => {
      const station = { stage: 0, step: 1 }
      expect(eventOfRestoring(restoring, [], station, at)).toEqual({
        kind: "restored",
        stage: 0,
        step: 1,
        at,
      })
      expect(eventOfRestoring(restoring, [restored(0, 1)], station, at)).toBeNull()
    })

    it("throws at a station that is not a step that restores: a step, a rest, the final stage", () => {
      for (const station of [
        { stage: 0, step: 0 },
        { stage: 0, step: 3 },
        { stage: 2, step: 0 },
      ]) {
        expect(() => eventOfRestoring(restoring, [], station, at)).toThrow(/does not restore/)
      }
    })
  })

  describe("isRestoring", () => {
    it("is true only at a game not yet restored", () => {
      expect(isRestoring(restoring, [], today)).toBe(false)
      expect(isRestoring(restoring, [visited(0, 1)], today)).toBe(true)
      expect(isRestoring(restoring, [visited(0, 1), restored(0, 1)], today)).toBe(false)
      const on = [visited(0, 1), restored(0, 1), visited(0, 2)]
      expect(isRestoring(restoring, on, today)).toBe(false)
    })

    it("reads only the log: a step before the game that asks for writing changes nothing", () => {
      const asking = practiceOf({
        ...restoring,
        stages: [{ name: "One", steps: [ask, game] }],
      })
      // With nothing written, the hold is at the writing; the reader is at the game all the same
      expect(isRestoring(asking, [visited(0, 1)], today)).toBe(true)
    })

    it("is false in a finished stage, even at a game the log does not have restored", () => {
      const log = [visited(0, 1), visited(0, 3), finished(0, today, nextDay(today)), visited(0, 1)]
      expect(isRestoring(restoring, log, today)).toBe(false)
    })
  })
})

describe("the law: a step that discloses holds the reader there until every note is disclosed", () => {
  const note = { id: "bird", notehead: "l1 Bird", tags: [], body: "The bird." }
  const notes: Parts = { ...REST, prose: ["Read them."], disclose: [note, { ...note, id: "walk" }] }
  /** Stage 1: a, the notes, c, its rest at 3; stage 2: d, its rest at 1. */
  const disclosing = practiceOf({
    id: "disclosing",
    title: "Disclosing",
    text: "fixture",
    stages: [
      { name: "First", steps: [say("a"), notes, say("c")] },
      { name: "Second", steps: [say("d")] },
    ],
  })
  const disclosed = (stage: number, step: number): Event => ({
    kind: "disclosed",
    stage,
    step,
    at: 0,
  })
  const restored = (stage: number, step: number): Event => ({
    kind: "restored",
    stage,
    step,
    at: 0,
  })
  const today = "2026-11-10"
  const at = 1_000

  it("holds the reader at the notes until the log has them disclosed", () => {
    expect(replay(disclosing, [], today)).toEqual(standing(0, 0, null, 1))
    expect(replay(disclosing, [visited(0, 1)], today)).toEqual(standing(0, 1, null, 1))
    expect(replay(disclosing, [visited(0, 1), disclosed(0, 1)], today)).toEqual(standing(0, 1))
  })

  it("counts only the step's own disclosing, not another step's, nor its restoring", () => {
    const log = [visited(0, 1), disclosed(0, 0), disclosed(1, 1), restored(0, 1)]
    expect(replay(disclosing, log, today).heldAt).toBe(1)
  })

  it("at the notes, lets the reader go back, but not on: they are not locked there", () => {
    const here = standing(0, 1, null, 1)
    expect(ruling(disclosing, here, 0)).toEqual({ allowed: true, to: 0, finishes: false })
    for (const target of [2, 3]) {
      expect(ruling(disclosing, here, target)).toEqual({
        allowed: false,
        reason: { kind: "unanswered" },
      })
    }
  })

  it("once disclosed, lets the reader on", () => {
    const here = replay(disclosing, [visited(0, 1), disclosed(0, 1)], today)
    expect(ruling(disclosing, here, 2)).toEqual({ allowed: true, to: 2, finishes: false })
  })

  it("walks: to the notes, back before they are disclosed, to them again, disclosed, and on", () => {
    const log: Event[] = []
    const walk = (target: number) => {
      log.push(...eventsOfMove(disclosing, replay(disclosing, log, today), target, at, today))
      return replay(disclosing, log, today)
    }
    expect(walk(1)).toEqual(standing(0, 1, null, 1))
    expect(walk(0)).toEqual(standing(0, 0, null, 1))
    expect(walk(1)).toEqual(standing(0, 1, null, 1))
    const event = eventOfDisclosing(disclosing, log, { stage: 0, step: 1 }, at)
    expect(event).toEqual({ kind: "disclosed", stage: 0, step: 1, at })
    log.push(event!)
    expect(walk(2)).toEqual(standing(0, 2))
    expect(walk(3)).toEqual(standing(0, 3, nextDay(today)))
  })

  it("does not keep the reader in practice mode: only a step that restores does", () => {
    expect(isRestoring(disclosing, [visited(0, 1)], today)).toBe(false)
  })

  describe("eventOfDisclosing", () => {
    it("gives the step disclosed, once: nothing when the log has it already", () => {
      const station = { stage: 0, step: 1 }
      expect(eventOfDisclosing(disclosing, [], station, at)).toEqual({
        kind: "disclosed",
        stage: 0,
        step: 1,
        at,
      })
      expect(eventOfDisclosing(disclosing, [disclosed(0, 1)], station, at)).toBeNull()
    })

    it("throws at a station that is not a step that discloses: a step, a rest, the final stage", () => {
      for (const station of [
        { stage: 0, step: 0 },
        { stage: 0, step: 3 },
        { stage: 2, step: 0 },
      ]) {
        expect(() => eventOfDisclosing(disclosing, [], station, at)).toThrow(/does not disclose/)
      }
    })
  })
})
