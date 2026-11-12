import { describe, expect, it } from "vitest"
import type { Note } from "../../material/types"
import { idOf, noteFor, problemsOf } from "../notes"
import type { Practice, Stage } from "../types"

/** A note as toNotes makes one, with only what these tests look at. */
const note = (index: number, loomId: string | null): Note => ({
  index,
  loomId,
  lemma: [],
  tags: [],
  paragraphs: [],
})

const notes = [note(0, "angle-worm"), note(1, null), note(2, "beads")]

const stage = (name: string, ...refs: string[]): Stage => ({
  name,
  steps: refs.map((ref) => ({ direction: "consider", note: ref, prose: [] })),
})

const practiceOf = (...stages: Stage[]): Practice => ({
  id: "test",
  title: "Test",
  text: "dickinson",
  stages,
})

describe("idOf", () => {
  it("reads the id in a reference", () => {
    expect(idOf("@angle-worm")).toBe("angle-worm")
    expect(idOf("@note_2")).toBe("note_2")
  })

  it("reads nothing that is not a reference to a note in this text", () => {
    for (const ref of ["angle-worm", "@", "@two words", "@a:b", "@dickinson/worm", ""]) {
      expect(idOf(ref)).toBeNull()
    }
  })
})

describe("noteFor", () => {
  it("finds a note by its loom id, wherever it stands", () => {
    expect(noteFor("@beads", notes)).toBe(notes[2])
    expect(noteFor("@beads", [...notes].reverse())).toBe(notes[2])
  })

  it("finds nothing for an unknown id or a malformed reference", () => {
    expect(noteFor("@flight", notes)).toBeNull()
    expect(noteFor("beads", notes)).toBeNull()
  })

  it("never matches a note without an id", () => {
    expect(noteFor("@null", notes)).toBeNull()
    expect(noteFor("@", notes)).toBeNull()
  })
})

describe("problemsOf", () => {
  it("finds nothing wrong with a practice whose notes are all there", () => {
    const practice = practiceOf(stage("The meal", "@angle-worm", "@beads"))
    expect(problemsOf(practice, notes)).toEqual([])
  })

  it("names a note that is not in the text, by stage and step", () => {
    const practice = practiceOf(stage("The meal", "@angle-worm"), stage("The flight", "@flight"))
    expect(problemsOf(practice, notes)).toEqual([
      'stage 2 "The flight", step 1: no note @flight in dickinson',
    ])
  })

  it("names a reference that is not one", () => {
    const practice = practiceOf(stage("The meal", "angle-worm"))
    expect(problemsOf(practice, notes)).toEqual([
      'stage 1 "The meal", step 1: angle-worm is not a note reference; write @ and the note\'s id',
    ])
  })

  it("names a reference to another text, which is not read yet", () => {
    const practice = practiceOf(stage("The meal", "@vendler/marriage"))
    expect(problemsOf(practice, notes)).toEqual([
      'stage 1 "The meal", step 1: @vendler/marriage refers to another text, which is not read yet',
    ])
  })

  it("looks for no note in a respond step, which refers to none", () => {
    const practice = practiceOf({
      name: "The meal",
      steps: [{ direction: "respond", prose: ["What does the bird eat?"] }],
    })
    expect(problemsOf(practice, notes)).toEqual([])
  })

  it("names an empty stage, and a practice with no stages", () => {
    expect(problemsOf(practiceOf(stage("Nothing")), notes)).toEqual(['stage 1 "Nothing": no steps'])
    expect(problemsOf(practiceOf(), notes)).toEqual(["no stages"])
  })

  it("lists every problem, in order, not just the first", () => {
    const practice = practiceOf(
      stage("The meal", "@angle-worm", "beads"),
      stage("Nothing"),
      stage("The flight", "@flight"),
    )
    expect(problemsOf(practice, notes)).toEqual([
      'stage 1 "The meal", step 2: beads is not a note reference; write @ and the note\'s id',
      'stage 2 "Nothing": no steps',
      'stage 3 "The flight", step 1: no note @flight in dickinson',
    ])
  })
})
