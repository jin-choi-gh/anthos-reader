import { describe, expect, it } from "vitest"
import type { Anchor } from "../../material/types"
import { eventOfNoting, eventOfRevising, eventOfWithdrawing, notesFrom, notesOf } from "../notebook"
import type { NoteId, NotebookEvent, Provenance } from "../types"

const whole: Anchor = { kind: "whole", text: "dickinson" }
const here: Provenance = { practice: "first-reading", stage: 0, step: 2 }
const a = "a" as NoteId
const b = "b" as NoteId

const noted = (
  id: NoteId,
  body: string,
  from: Provenance | null = here,
  at = 1,
): NotebookEvent => ({
  kind: "noted",
  id,
  at,
  anchor: whole,
  body,
  from,
})

describe("notesOf: the notebook as it stands", () => {
  it("is empty with no events", () => {
    expect(notesOf([])).toEqual([])
  })

  it("keeps each note as written, in the order written", () => {
    expect(notesOf([noted(a, "A worm."), noted(b, "Beads.", null, 2)])).toEqual([
      { id: a, anchor: whole, body: "A worm.", from: here, writtenAt: 1, revisedAt: null },
      { id: b, anchor: whole, body: "Beads.", from: null, writtenAt: 2, revisedAt: null },
    ])
  })

  it("gives a revised note its latest body, and keeps when it was first written", () => {
    const events: NotebookEvent[] = [
      noted(a, "A worm."),
      { kind: "revised", id: a, at: 5, body: "A worm, raw." },
      { kind: "revised", id: a, at: 9, body: "A worm, raw, and cold." },
    ]
    expect(notesOf(events)).toEqual([
      {
        id: a,
        anchor: whole,
        body: "A worm, raw, and cold.",
        from: here,
        writtenAt: 1,
        revisedAt: 9,
      },
    ])
  })

  it("leaves out a withdrawn note", () => {
    const events: NotebookEvent[] = [
      noted(a, "A worm."),
      noted(b, "Beads."),
      { kind: "withdrawn", id: a, at: 3 },
    ]
    expect(notesOf(events).map((note) => note.id)).toEqual([b])
  })

  it("ignores events about a note it does not have, and a second noting of the same id", () => {
    const events: NotebookEvent[] = [
      { kind: "revised", id: a, at: 2, body: "Nothing to revise." },
      { kind: "withdrawn", id: b, at: 2 },
      noted(a, "First."),
      noted(a, "Again."),
    ]
    expect(notesOf(events).map((note) => note.body)).toEqual(["First."])
  })
})

describe("notesFrom: the notes written on one frame", () => {
  const notes = notesOf([
    noted(a, "Here."),
    noted(b, "Elsewhere.", { ...here, step: 1 }),
    noted("c" as NoteId, "Another practice.", { ...here, practice: "slow-reading" }),
    noted("d" as NoteId, "At the viewing table.", null),
  ])

  it("finds only the notes from that practice, stage and step", () => {
    expect(notesFrom(notes, here).map((note) => note.body)).toEqual(["Here."])
  })
})

describe("the deciders", () => {
  const notes = notesOf([noted(a, "A worm.")])

  it("note: a new note, with the id and time it is given, its body trimmed", () => {
    expect(
      eventOfNoting({ anchor: whole, body: "  Beads. ", from: here }, { id: b, at: 4 }),
    ).toEqual(noted(b, "Beads.", here, 4))
  })

  it("revise: a new body for a note the notebook has", () => {
    expect(eventOfRevising(notes, a, "A worm, raw.", 6)).toEqual({
      kind: "revised",
      id: a,
      at: 6,
      body: "A worm, raw.",
    })
  })

  it("withdraw: a note the notebook has", () => {
    expect(eventOfWithdrawing(notes, a, 7)).toEqual({ kind: "withdrawn", id: a, at: 7 })
  })

  it("refuses an empty note, and a note it does not have", () => {
    expect(() =>
      eventOfNoting({ anchor: whole, body: "  ", from: here }, { id: b, at: 4 }),
    ).toThrow(RangeError)
    expect(() => eventOfRevising(notes, a, "", 6)).toThrow(RangeError)
    expect(() => eventOfRevising(notes, b, "Beads.", 6)).toThrow(RangeError)
    expect(() => eventOfWithdrawing(notes, b, 7)).toThrow(RangeError)
  })

  it("agrees with notesOf: what the deciders write, the notebook reads back", () => {
    const events = [eventOfNoting({ anchor: whole, body: "A worm.", from: here }, { id: a, at: 1 })]
    events.push(eventOfRevising(notesOf(events), a, "A worm, raw.", 2))
    expect(notesOf(events)).toEqual([
      { id: a, anchor: whole, body: "A worm, raw.", from: here, writtenAt: 1, revisedAt: 2 },
    ])
  })
})
