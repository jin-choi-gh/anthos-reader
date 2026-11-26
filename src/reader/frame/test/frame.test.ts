import { describe, expect, it } from "vitest"
import type { Material } from "../../../material/materials"
import { notesFor } from "../../../material/notes"
import type { Fingerprint } from "../../../material/types"
import type { NoteId, ReaderNote } from "../../../notebook/types"
import { fingerprintOfPractice } from "../../../practice/fingerprint"
import { REST } from "../../../practice/parts"
import type { EditorsNote, Parts } from "../../../practice/types"
import type { Standing } from "../../../runner/types"
import { annotateFrame, frameOf } from "../frame"
import { practiceOf } from "../../../practice/test/build"

/** Lines of the substrate, each with the id loom would give it: "l1", "l2", and on. */
const withIds = (texts: readonly string[]) => texts.map((text, i) => ({ id: `l${i + 1}`, text }))

/** Where a run stands: at a station, with when the next stage opens and where it holds. */
const standing = (
  stage: number,
  step: number,
  opensOn: string | null = null,
  heldAt: number | null = null,
): Standing => ({ station: { stage, step }, opensOn, heldAt })

/** The material: two lines of poem. */
const material: Material = {
  substrate: { lines: withIds(["A Bird, came down the Walk -", "He bit an Angle Worm in halves"]) },
  words: [],
  fingerprint: "f" as Fingerprint,
  poem: { title: "Fixture", author: "", stanzas: [] },
}

/** The editor's notes the practice's steps highlight, by their ids. "missing" cannot be placed on
 * these lines. */
const editorsNotes: Record<string, EditorsNote> = {
  a: { id: "a", notehead: "l1 Bird", tags: [], body: "On the bird." },
  b: { id: "b", notehead: "l2 Worm", tags: ["gloss"], body: "On the worm.\n\nAnd its halves." },
  missing: { id: "missing", notehead: "l9", tags: [], body: "Nowhere." },
}

/** A commentary of none of the editor's notes. */
const noNotes = expect.objectContaining({ notes: [] })

/** The whole of that poem. */
const whole = { start: { line: 0, offset: 0 }, end: { line: 1, offset: 30 } }

/** A note of the reader's on the whole poem, written on its lines unless said otherwise. */
const mine = (id: string, body: string, more: Partial<ReaderNote> = {}): ReaderNote => ({
  id: id as NoteId,
  targets: [whole],
  tags: [],
  body,
  fingerprint: "f" as Fingerprint,
  from: null,
  writtenAt: 0,
  revisedAt: null,
  ...more,
})

/** A step that highlights one of the editor's notes. */
const look = (id: string): Parts => ({
  ...REST,
  prose: [`On ${id}.`],
  highlight: [editorsNotes[id]!],
})
/** A step that asks for one note on the whole poem. */
const askWhole: Parts = {
  ...REST,
  prose: ["What does the bird eat?"],
  writing: { target: "whole", tags: [], count: "one" },
}
/** A step that asks for one note on passages the reader chooses. */
const askChosen: Parts = {
  ...REST,
  prose: ["Where does the bird change?"],
  writing: { target: "chosen", tags: [], count: "one" },
}

/** Two stages: the rests are at step 2 and step 3. The note "missing" cannot be placed. */
const practice = practiceOf({
  id: "test",
  title: "Test",
  text: "fixture",
  stages: [
    { name: "First", steps: [look("a"), look("b")] },
    { name: "Second", steps: [look("missing"), look("a"), askWhole] },
  ],
})

const noSuchStep = { allowed: false, reason: { kind: "noSuchStep" } }
const finished = { allowed: false, reason: { kind: "finished" } }

describe("frameOf: where the frame may go", () => {
  it("on a stage's first step: headed by the stage, nothing behind, the next step ahead", () => {
    const frame = frameOf(practice, standing(1, 0), material, [])
    expect(frame.heading).toBe("Second")
    expect(frame.back).toEqual(noSuchStep)
    expect(frame.next).toEqual({ allowed: true, to: 1, finishes: false })
  })

  it("on the last step: the rest is ahead, and reaching it finishes the stage", () => {
    const frame = frameOf(practice, standing(0, 1), material, [])
    expect(frame.back).toEqual({ allowed: true, to: 0, finishes: false })
    expect(frame.next).toEqual({ allowed: true, to: 2, finishes: true })
  })

  it("on the last step of a stage finished already: on to the rest, finishing nothing", () => {
    const frame = frameOf(practice, standing(0, 1, "2026-11-12"), material, [])
    expect(frame.next).toEqual({ allowed: true, to: 2, finishes: false })
  })

  it("at the rest, waiting: back to the last step, and the next stage not open until its day", () => {
    const frame = frameOf(practice, standing(0, 2, "2026-11-12"), material, [])
    expect(frame.heading).toBe("First")
    expect(frame.back).toEqual({ allowed: true, to: 1, finishes: false })
    expect(frame.next).toEqual({
      allowed: false,
      reason: { kind: "waiting", opensOn: "2026-11-12" },
    })
  })

  it("held at a step that asks for writing: the runner refuses Next, as unanswered", () => {
    const frame = frameOf(practice, standing(1, 2, null, 2), material, [])
    expect(frame.next).toEqual({ allowed: false, reason: { kind: "unanswered" } })
  })

  it("in the final stage: headed by the practice, back to the last stage's last step, and on nowhere", () => {
    const frame = frameOf(practice, standing(2, 0), material, [])
    expect(frame.heading).toBe("Test")
    expect(frame.back).toEqual({ allowed: true, to: 2, finishes: false })
    expect(frame.next).toEqual(finished)
  })
})

describe("frameOf: the step's position in its stage", () => {
  it("on a step: its number, from 1, and how many steps its stage has", () => {
    expect(frameOf(practice, standing(0, 1), material, []).position).toEqual({ step: 2, of: 2 })
    expect(frameOf(practice, standing(1, 0), material, []).position).toEqual({ step: 1, of: 3 })
  })

  it("at a rest, in the final stage and in annotate mode: none", () => {
    expect(frameOf(practice, standing(0, 2), material, []).position).toBeNull()
    expect(frameOf(practice, standing(2, 0), material, []).position).toBeNull()
    expect(annotateFrame("poem", material, []).position).toBeNull()
  })
})

describe("frameOf: the subject, made of parts, in the practice's text", () => {
  it("on a step with an editor's note: the note, placed by its notehead and picked out, and the prose", () => {
    const { subject } = frameOf(practice, standing(0, 1), material, [])
    expect(subject).toEqual({
      key: "test/0/1",
      text: "fixture",
      prose: ["On b."],
      commentary: {
        set: expect.objectContaining({ notes: subject.commentary.notes }),
        notes: [
          {
            index: 0,
            id: "b",
            lemma: [{ kind: "quote", text: "Worm" }],
            tags: ["gloss"],
            paragraphs: ["On the worm.", "And its halves."],
          },
        ],
        shown: "marked",
        written: null,
        recalled: null,
      },
      writing: null,
      noting: null,
      restore: null,
      picking: null,
    })
    expect(subject.commentary.set.rangesOn(1)).toEqual([{ start: 16, end: 20, noteIndex: 0 }])
    expect(subject.commentary.set.rangesOn(0)).toEqual([])
  })

  it("on a step whose note cannot be placed on these lines: nothing picked out, still the prose", () => {
    const { subject } = frameOf(practice, standing(1, 0), material, [])
    expect(subject.commentary.notes).toEqual([])
    expect(subject.prose).toEqual(["On missing."])
  })

  it("on a step asking for writing on the whole poem: the prose, nothing picked out, and a page for one note", () => {
    const { subject } = frameOf(practice, standing(1, 2), material, [])
    expect(subject).toEqual({
      key: "test/1/2",
      text: "fixture",
      prose: ["What does the bird eat?"],
      commentary: {
        set: noNotes,
        notes: [],
        shown: "marked",
        written: null,
        recalled: null,
      },
      writing: {
        about: { kind: "fixed", targets: [whole] },
        tags: [],
        count: "one",
        written: [],
      },
      noting: null,
      restore: null,
      picking: null,
    })
  })

  it("on a step asking for writing: what the reader has written on that very step, and nothing else", () => {
    const written = (id: string, step: number): ReaderNote => ({
      id: id as NoteId,
      targets: [whole],
      tags: [],
      fingerprint: "f" as Fingerprint,
      body: "Worms.",
      from: { practice: "test", fingerprint: fingerprintOfPractice(practice), stage: 1, step },
      writtenAt: 0,
      revisedAt: null,
    })
    const here = written("here", 2)
    const { subject } = frameOf(practice, standing(1, 2), material, [written("elsewhere", 1), here])
    expect(subject.writing?.written).toEqual([here])
  })

  it("at the rest, whether waiting or not: nothing said and nothing asked", () => {
    for (const opensOn of [null, "2026-11-12"]) {
      const { subject } = frameOf(practice, standing(0, 2, opensOn), material, [])
      expect(subject).toEqual({
        key: "test/0/2",
        text: "fixture",
        prose: [],
        commentary: {
          set: noNotes,
          notes: [],
          shown: "marked",
          written: null,
          recalled: null,
        },
        writing: null,
        noting: null,
        restore: null,
        picking: null,
      })
    }
  })

  it("in the final stage: word that the practice is done", () => {
    const { subject } = frameOf(practice, standing(2, 0), material, [])
    expect(subject.prose).toEqual(["Explicit."])
    expect(subject.writing).toBeNull()
  })

  it("gives each frame its own key, and the same frame the same key", () => {
    const keys = [
      standing(0, 0),
      standing(0, 1),
      standing(0, 2),
      standing(1, 0),
      standing(2, 0),
    ].map((where) => frameOf(practice, where, material, []).subject.key)
    expect(new Set(keys).size).toBe(keys.length)
    expect(frameOf(practice, standing(0, 1, "2026-11-12"), material, []).subject.key).toBe(
      "test/0/1",
    )
  })
})

describe("frameOf: the set the editor's notes come from", () => {
  it("is the step's own notes, placed as notesFor places them, every one picked out", () => {
    const { commentary } = frameOf(practice, standing(0, 0), material, []).subject
    const placed = notesFor(material.substrate, [
      {
        id: "a",
        targets: [{ start: { line: 0, offset: 2 }, end: { line: 0, offset: 6 } }],
        tags: [],
        body: "On the bird.",
      },
    ])
    expect(commentary.set.notes).toEqual(placed.notes)
    expect(commentary.notes).toBe(commentary.set.notes)
  })
})

describe("annotateFrame: annotate mode", () => {
  it("has no heading and never moves: no rulings at all, rather than refusals", () => {
    const frame = annotateFrame("poem", material, [])
    expect(frame.heading).toBeNull()
    expect(frame.back).toBeNull()
    expect(frame.next).toBeNull()
  })

  it("lists the reader's own notes, in the order written, shown as the editor's are", () => {
    const written = [mine("n1", "Worms."), mine("n2", "Beads.\n\nFear.")]
    const { subject } = annotateFrame("poem", material, written)
    expect(subject).toMatchObject({ key: "annotate", text: "poem", prose: [], writing: null })
    const { set, notes: shown } = subject.commentary
    expect(subject.commentary.shown).toBe("listed")
    expect(shown).toBe(set.notes)
    const wholePoem = [{ kind: "citation", text: "the whole poem" }]
    expect(shown).toEqual([
      { index: 0, id: "n1", lemma: wholePoem, tags: [], paragraphs: ["Worms."] },
      { index: 1, id: "n2", lemma: wholePoem, tags: [], paragraphs: ["Beads.", "Fear."] },
    ])
  })

  it("shows none of the editor's notes: with nothing written, the list is empty", () => {
    const { commentary } = annotateFrame("poem", material, []).subject
    expect(commentary.notes).toEqual([])
    expect(commentary.set.notes).toEqual([])
  })

  it("leaves out a note written on other lines, and one whose target is not in the poem", () => {
    const elsewhere = mine("elsewhere", "Older.", { fingerprint: "g" as Fingerprint })
    const past = mine("past", "Broken.", {
      targets: [{ start: { line: 0, offset: 0 }, end: { line: 5, offset: 1 } }],
    })
    const { notes: shown } = annotateFrame("poem", material, [
      elsewhere,
      past,
      mine("kept", "Kept."),
    ]).subject.commentary
    expect(shown.map((note) => [note.index, note.id])).toEqual([[0, "kept"]])
  })
})

describe("noting: a new note on passages the reader chooses", () => {
  it("is in annotate mode, on the material's poem, and never in practice mode", () => {
    expect(annotateFrame("poem", material, []).subject.noting).toEqual({
      substrate: material.substrate,
      tags: [],
    })
    for (const [stage, step] of [
      [0, 0],
      [1, 2],
      [0, 2],
      [2, 0],
    ] as const) {
      expect(frameOf(practice, standing(stage, step), material, []).subject.noting).toBeNull()
    }
  })
})

describe("annotateFrame: the notes written in annotate mode, which can be deleted", () => {
  it("lists only the notes with no provenance, in the order written, and carries them in that order", () => {
    const first = mine("n1", "First.")
    const practised = mine("p", "Written in the practice.", {
      from: { practice: "test", fingerprint: fingerprintOfPractice(practice), stage: 0, step: 2 },
    })
    const second = mine("n2", "Second.")
    const { commentary } = annotateFrame("poem", material, [first, practised, second]).subject
    expect(commentary.notes.map((note) => [note.index, note.id])).toEqual([
      [0, "n1"],
      [1, "n2"],
    ])
    expect(commentary.written).toEqual([first, second])
  })

  it("carries none of the reader's notes in practice mode, so nothing there can be deleted", () => {
    expect(frameOf(practice, standing(0, 0), material, []).subject.commentary.written).toBeNull()
  })
})

describe("frameOf: a step asking for writing on chosen passages, wherever the editor puts it", () => {
  /** Writing on chosen passages first in a stage, and twice in a row after writing on the whole poem. */
  const askingChosen = practiceOf({
    ...practice,
    stages: [
      { name: "First", steps: [askChosen, look("a")] },
      { name: "Second", steps: [askWhole, askChosen, askChosen] },
    ],
  })
  const bird = { start: { line: 0, offset: 2 }, end: { line: 0, offset: 6 } }
  const on = (stage: number, step: number, more: Partial<ReaderNote> = {}) =>
    mine(`${stage}/${step}`, "Fed.", {
      targets: [bird],
      from: { practice: "test", fingerprint: fingerprintOfPractice(askingChosen), stage, step },
      ...more,
    })

  it("asks for one note on passages the reader chooses from the poem's lines, with no notes picked out", () => {
    const { subject } = frameOf(askingChosen, standing(0, 0), material, [])
    expect(subject).toEqual({
      key: "test/0/0",
      text: "fixture",
      prose: ["Where does the bird change?"],
      commentary: {
        set: noNotes,
        notes: [],
        shown: "marked",
        written: null,
        recalled: null,
      },
      writing: {
        about: { kind: "chosen", substrate: material.substrate },
        tags: [],
        count: "one",
        written: [],
      },
      noting: null,
      restore: null,
      picking: null,
    })
  })

  it("finds the note written on that very step, and not on the step beside it", () => {
    const notes = [on(1, 1), on(1, 2), on(0, 0)]
    expect(frameOf(askingChosen, standing(1, 1), material, notes).subject.writing?.written).toEqual(
      [notes[0]],
    )
    expect(frameOf(askingChosen, standing(1, 2), material, notes).subject.writing?.written).toEqual(
      [notes[1]],
    )
  })

  it("finds only a note written on these lines whose every target keeps the rule for spans", () => {
    const notes = [
      on(0, 0, { fingerprint: "g" as Fingerprint }),
      on(0, 0, {
        id: "bad" as NoteId,
        targets: [{ start: { line: 0, offset: 0 }, end: { line: 5, offset: 1 } }],
      }),
    ]
    expect(frameOf(askingChosen, standing(0, 0), material, notes).subject.writing?.written).toEqual(
      [],
    )
  })

  it("leaves the note of a step asking for writing on the whole poem found, whatever lines it was written on", () => {
    const old = mine("r", "Worms.", {
      from: {
        practice: "test",
        fingerprint: fingerprintOfPractice(askingChosen),
        stage: 1,
        step: 0,
      },
      fingerprint: "g" as Fingerprint,
    })
    expect(frameOf(askingChosen, standing(1, 0), material, [old]).subject.writing?.written).toEqual(
      [old],
    )
  })
})

describe("frameOf: a recall step, bringing back the stage it names", () => {
  const recalling = practiceOf({
    ...practice,
    stages: [
      { name: "First", steps: [look("a"), askChosen, askWhole] },
      {
        name: "Second",
        steps: [
          { ...REST, prose: ["Yesterday, you wrote:"], recall: { from: "stage", id: "stage-1" } },
        ],
      },
    ],
  })
  const version = fingerprintOfPractice(recalling)
  const bird = { start: { line: 0, offset: 2 }, end: { line: 0, offset: 6 } }
  const at = (stage: number, step: number, fingerprint = version) => ({
    from: { practice: "test", fingerprint, stage, step },
  })
  // Written in this order: the note on the whole poem first, then the note on chosen passages
  const answered = mine("r", "Worms.", at(0, 2))
  const observed = mine("o", "A bird.", { targets: [bird], ...at(0, 1) })
  const recallAt = (written: readonly ReaderNote[]) =>
    frameOf(recalling, standing(1, 0), material, written).subject

  it("lists the stage before's notes, in the order of their steps, each with its prompt", () => {
    const subject = recallAt([answered, observed])
    expect(subject.prose).toEqual(["Yesterday, you wrote:"])
    expect(subject.writing).toBeNull()
    expect(subject.noting).toBeNull()
    const { commentary } = subject
    expect(commentary.shown).toBe("listed")
    expect(commentary.notes.map((note) => note.id)).toEqual(["o", "r"])
    expect(commentary.recalled).toEqual([
      { prompt: ["Where does the bird change?"], whole: false, heading: "First" },
      { prompt: ["What does the bird eat?"], whole: true, heading: null },
    ])
  })

  it("carries no note to delete", () => {
    expect(recallAt([answered, observed]).commentary.written).toBeNull()
  })

  it("leaves out notes of another version, another stage, annotate mode, or other lines", () => {
    const others = [
      mine("v", "Another version.", at(0, 2, "00000000000000" as typeof version)),
      mine("s", "This stage.", at(1, 0)),
      mine("m", "In annotate mode."),
      mine("g", "On other lines.", { ...at(0, 1), fingerprint: "g" as Fingerprint }),
      mine("x", "On no step of this version.", at(0, 3)),
    ]
    const { commentary } = recallAt([...others, answered])
    expect(commentary.notes.map((note) => note.id)).toEqual(["r"])
    expect(commentary.recalled).toHaveLength(1)
  })

  it("lists nothing when nothing from the stage before can be found", () => {
    expect(recallAt([]).commentary).toMatchObject({ notes: [], recalled: [] })
  })

  it("counts the reader's note on a writing step only on this version", () => {
    const edited = practiceOf({
      ...recalling,
      stages: [
        {
          ...recalling.stages[0]!,
          steps: [look("a"), askChosen, { ...askWhole, prose: ["Now?"] }],
        },
        recalling.stages[1]!,
      ],
    })
    expect(frameOf(edited, standing(0, 2), material, [answered]).subject.writing?.written).toEqual(
      [],
    )
    expect(
      frameOf(recalling, standing(0, 2), material, [answered]).subject.writing?.written,
    ).toEqual([answered])
  })
})

describe("frameOf: a recall step, bringing back the step it names", () => {
  const recall = (id: string) => ({
    ...REST,
    prose: ["Just now, you wrote:"],
    recall: { from: "step", id } as const,
  })
  const recalling = practiceOf({
    ...practice,
    stages: [{ name: "First", steps: [look("a"), askChosen, askWhole, recall("step-3")] }],
  })
  const version = fingerprintOfPractice(recalling)
  const bird = { start: { line: 0, offset: 2 }, end: { line: 0, offset: 6 } }
  const at = (stage: number, step: number) => ({
    from: { practice: "test", fingerprint: version, stage, step },
  })
  const answered = mine("r", "Worms.", at(0, 2))
  const observed = mine("o", "A bird.", { targets: [bird], ...at(0, 1) })

  it("lists only the notes written on that step, even one earlier in the same stage", () => {
    const { commentary } = frameOf(recalling, standing(0, 3), material, [
      observed,
      answered,
    ]).subject
    expect(commentary.notes.map((note) => note.id)).toEqual(["r"])
    expect(commentary.recalled).toEqual([
      { prompt: ["What does the bird eat?"], whole: true, heading: "First" },
    ])
  })

  it("lists nothing for a step that is not there", () => {
    const gone = practiceOf({
      ...practice,
      stages: [{ name: "First", steps: [look("a"), askChosen, askWhole, recall("gone")] }],
    })
    const { commentary } = frameOf(gone, standing(0, 3), material, [observed, answered]).subject
    expect(commentary).toMatchObject({ notes: [], recalled: [] })
  })
})

describe("frameOf: the final stage, bringing back every stage", () => {
  /** Three stages, the first two with the same name, each asking for writing. */
  const finishing = practiceOf({
    ...practice,
    stages: [
      { name: "First", steps: [look("a"), askChosen, askWhole] },
      { name: "First", steps: [askWhole, look("b")] },
      { name: "Third", steps: [askChosen] },
    ],
  })
  const version = fingerprintOfPractice(finishing)
  const bird = { start: { line: 0, offset: 2 }, end: { line: 0, offset: 6 } }
  const at = (stage: number, step: number, fingerprint = version) => ({
    from: { practice: "test", fingerprint, stage, step },
  })
  const finalOf = (written: readonly ReaderNote[]) =>
    frameOf(finishing, standing(3, 0), material, written)

  it("is headed by the practice, says it is done, and asks nothing", () => {
    const { heading, subject } = finalOf([])
    expect(heading).toBe("Test")
    expect(subject.prose).toEqual(["Explicit."])
    expect(subject.writing).toBeNull()
    expect(subject.noting).toBeNull()
  })

  it("lists every stage's notes, by stage, then step, then the order written, with prompts", () => {
    const written = [
      mine("c", "Third stage.", { targets: [bird], ...at(2, 0) }),
      mine("r", "Worms.", at(0, 2)),
      mine("o", "A bird.", { targets: [bird], ...at(0, 1) }),
      mine("s", "Second stage.", at(1, 0)),
      mine("s2", "Second, again.", at(1, 0)),
    ]
    const { commentary } = finalOf(written).subject
    expect(commentary.shown).toBe("listed")
    expect(commentary.written).toBeNull()
    expect(commentary.notes.map((note) => note.id)).toEqual(["o", "r", "s", "s2", "c"])
    expect(commentary.recalled).toEqual([
      { prompt: ["Where does the bird change?"], whole: false, heading: "First" },
      { prompt: ["What does the bird eat?"], whole: true, heading: null },
      { prompt: ["What does the bird eat?"], whole: true, heading: "First" },
      { prompt: ["What does the bird eat?"], whole: true, heading: null },
      { prompt: ["Where does the bird change?"], whole: false, heading: "Third" },
    ])
  })

  it("gives no heading to a stage none of whose notes can be found", () => {
    const written = [
      mine("g", "On other lines.", { ...at(0, 2), fingerprint: "g" as Fingerprint }),
      mine("c", "Third stage.", { targets: [bird], ...at(2, 0) }),
    ]
    const { commentary } = finalOf(written).subject
    expect(commentary.notes.map((note) => note.id)).toEqual(["c"])
    expect(commentary.recalled?.map((recalled) => recalled.heading)).toEqual(["Third"])
  })

  it("leaves out notes of another version, of annotate mode, and of other lines", () => {
    const written = [
      mine("v", "Another version.", at(0, 2, "00000000000000" as typeof version)),
      mine("m", "In annotate mode."),
      mine("g", "On other lines.", { ...at(1, 0), fingerprint: "g" as Fingerprint }),
    ]
    expect(finalOf(written).subject.commentary).toMatchObject({ notes: [], recalled: [] })
  })

  it("recalls nothing in a practice that asks for no writing: the editor's notes, none picked out", () => {
    const silent = practiceOf({ ...practice, stages: [{ name: "Only", steps: [look("a")] }] })
    const { commentary } = frameOf(silent, standing(1, 0), material, []).subject
    expect(commentary).toEqual({
      set: noNotes,
      notes: [],
      shown: "marked",
      written: null,
      recalled: null,
    })
  })
})

describe("frameOf: a step that only says something", () => {
  const saying = practiceOf({
    ...practice,
    stages: [{ name: "First", steps: [{ ...REST, prose: ["Read the poem through."] }] }],
  })

  it("gives its prose, picks out none of the editor's notes, and asks for nothing", () => {
    expect(frameOf(saying, standing(0, 0), material, []).subject).toEqual({
      key: "test/0/0",
      text: "fixture",
      prose: ["Read the poem through."],
      commentary: {
        set: noNotes,
        notes: [],
        shown: "marked",
        written: null,
        recalled: null,
      },
      writing: null,
      noting: null,
      restore: null,
      picking: null,
    })
  })

  it("lets the reader on, with or without anything written", () => {
    expect(frameOf(saying, standing(0, 0), material, []).next).toEqual({
      allowed: true,
      to: 1,
      finishes: true,
    })
  })
})

describe("frameOf: a step that restores", () => {
  const game = (of: "words" | "lines", ...gaps: string[]): Parts => ({
    ...REST,
    prose: ["Put them back."],
    restore: { of, gaps },
  })
  const restoring = (step: Parts) =>
    practiceOf({
      ...practice,
      stages: [{ name: "First", steps: [{ ...REST, prose: ["Read."] }, step] }],
    })
  const at = (step: Parts, heldAt: number | null = 1) =>
    frameOf(restoring(step), standing(0, 1, null, heldAt), material, []).subject

  it("places its gaps in the poem's order, however the editor lists them, each with its text", () => {
    const { restore } = at(game("words", "l2 Worm", "l1 Walk", "l1 Bird", "l2 Angle"))
    expect(restore?.of).toBe("words")
    expect(restore?.gaps).toEqual([
      { span: { start: { line: 0, offset: 2 }, end: { line: 0, offset: 6 } }, text: "Bird" },
      { span: { start: { line: 0, offset: 22 }, end: { line: 0, offset: 26 } }, text: "Walk" },
      { span: { start: { line: 1, offset: 10 }, end: { line: 1, offset: 15 } }, text: "Angle" },
      { span: { start: { line: 1, offset: 16 }, end: { line: 1, offset: 20 } }, text: "Worm" },
    ])
  })

  it("takes out whole lines, punctuation and all", () => {
    const { restore } = at(game("lines", "l2", "l1"))
    expect(restore?.gaps.map((gap) => gap.text)).toEqual([
      "A Bird, came down the Walk -",
      "He bit an Angle Worm in halves",
    ])
  })

  it("gives its slips, the gaps' texts, in alphabetical order, the same every time", () => {
    const step = game("words", "l2 Worm", "l1 Walk", "l1 Bird", "l2 Angle")
    expect(at(step).restore?.slips).toEqual(["Angle", "Bird", "Walk", "Worm"])
    expect(at(step).restore?.slips).toEqual(at(step).restore?.slips)
  })

  it("is not restored while the reader is held at it, and restored once they are not", () => {
    const step = game("words", "l1 Bird", "l1 Walk")
    expect(at(step, 1).restore?.restored).toBe(false)
    expect(at(step, null).restore?.restored).toBe(true)
  })

  it("picks out none of the editor's notes, and asks for no writing", () => {
    const subject = at(game("words", "l1 Bird", "l1 Walk"))
    expect(subject.commentary.notes).toEqual([])
    expect(subject.writing).toBeNull()
    expect(subject.prose).toEqual(["Put them back."])
  })

  it("leaves out a gap that cannot be placed", () => {
    const { restore } = at(game("words", "l1 Bird", "l9 Walk", "l1 Walk"))
    expect(restore?.gaps.map((gap) => gap.text)).toEqual(["Bird", "Walk"])
  })

  it("has no restore at a rest, in the final stage, or in annotate mode", () => {
    const practice = restoring(game("words", "l1 Bird", "l1 Walk"))
    expect(frameOf(practice, standing(0, 2), material, []).subject.restore).toBeNull()
    expect(frameOf(practice, standing(1, 0), material, []).subject.restore).toBeNull()
    expect(annotateFrame("fixture", material, []).subject.restore).toBeNull()
  })
})
