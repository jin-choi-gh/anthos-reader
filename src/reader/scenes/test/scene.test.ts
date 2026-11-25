import { describe, expect, it } from "vitest"
import type { Material } from "../../../material/materials"
import type { Fingerprint } from "../../../material/types"
import type { NoteId, ReaderNote } from "../../../notebook/types"
import { fingerprintOfPractice } from "../../../practice/fingerprint"
import { REST } from "../../../practice/parts"
import type { EditorsNote, Parts } from "../../../practice/types"
import type { Standing } from "../../../runner/types"
import { annotateFrame, frameOf } from "../../frame/frame"
import { scene, type SceneState } from "../scene"
import type { Subject } from "../types"
import { practiceOf } from "../../../practice/test/build"

/** Lines of the substrate, each with the id loom would give it: "l1", "l2", and on. */
const withIds = (texts: readonly string[]) => texts.map((text, i) => ({ id: `l${i + 1}`, text }))

// The scene as the frame drives it: subjects made by frameOf and annotateFrame, so these tests also
// show that the frame and the scene agree.

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
  fingerprint: "f" as Fingerprint,
  poem: { title: "Fixture", author: "", stanzas: [] },
}

/** The editor's notes the practice's steps highlight, by their ids. */
const editorsNotes: Record<string, EditorsNote> = {
  a: { id: "a", notehead: "l1 Bird", tags: [], body: "On the bird." },
  b: { id: "b", notehead: "l2 Worm", tags: [], body: "On the worm." },
}

/** The set of a step's own editor's notes, by their ids, as the viewer is given it. */
const setOf = (...ids: string[]) =>
  expect.objectContaining({ notes: ids.map((id, index) => expect.objectContaining({ index, id })) })

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

/** The subject in annotate mode, with what is in the notebook. */
const annotating = (written: readonly ReaderNote[]) =>
  annotateFrame("poem", material, written).subject

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

/** One stage: two steps with a note each, then one asking for writing. The rest is at step 3; the
 * final stage is stage 1. */
const practice = practiceOf({
  id: "test",
  title: "Test",
  text: "poem",
  stages: [{ name: "Only", steps: [look("a"), look("b"), askWhole] }],
})

/** The subject of a frame of the practice, with what is in the notebook. */
const at = (stage: number, step: number, written: readonly ReaderNote[] = []) =>
  frameOf(practice, standing(stage, step), material, written).subject

const tap = (index: number) => ({ kind: "tapNote", note: index }) as const
const close = { kind: "closeNote" } as const
const subject = (s: Subject) => ({ kind: "subject", subject: s }) as const

/** The scene, started on a subject: only its state, after checking it wrote nothing. */
function started(on: Subject): SceneState {
  const answer = scene.start(on)
  expect(answer.effects).toEqual([])
  return answer.state
}

describe("scene.start: each part staged", () => {
  it("on a step with an editor's note: its note picked out, closed; the prose; no writing", () => {
    const current = started(at(0, 1))
    expect(scene.viewer(current)).toEqual({
      kind: "marked",
      text: "poem",
      notes: setOf("b"),
      marked: [0],
      open: null,
      choosing: false,
      chosen: [],
    })
    expect(scene.praxisBar(current)).toEqual({ prose: ["On b."], writing: null, noting: null })
  })

  it("on a step asking for writing: the poem with nothing picked out; the prose and a blank page", () => {
    const current = started(at(0, 2))
    expect(scene.viewer(current)).toEqual({
      kind: "marked",
      text: "poem",
      notes: setOf(),
      marked: [],
      open: null,
      choosing: false,
      chosen: [],
    })
    expect(scene.praxisBar(current)).toEqual({
      prose: ["What does the bird eat?"],
      writing: {
        kind: "writing",
        draft: "",
        canSubmit: false,
        canCancel: false,
        passages: null,
      },
      noting: null,
    })
  })

  it("at the rest: the poem with nothing picked out, and nothing of its own in the praxis bar", () => {
    const current = started(at(0, 3))
    expect(scene.viewer(current)).toEqual({
      kind: "marked",
      text: "poem",
      notes: setOf(),
      marked: [],
      open: null,
      choosing: false,
      chosen: [],
    })
    expect(scene.praxisBar(current)).toBeNull()
  })

  it("in the final stage: the poem, and word that the practice is done", () => {
    expect(scene.praxisBar(started(at(1, 0)))).toEqual({
      prose: ["You have finished!"],
      writing: null,
      noting: null,
    })
  })

  it("in annotate mode: the reader's own notes listed, none open; a new note in the praxis bar", () => {
    const on = annotating([mine("n1", "Worms."), mine("n2", "Beads.")])
    const current = started(on)
    expect(scene.viewer(current)).toEqual({
      kind: "listed",
      text: "poem",
      notes: on.commentary.set,
      shown: [0, 1],
      open: null,
      deletable: true,
      recalled: null,
      choosing: false,
      chosen: [],
    })
    expect(scene.praxisBar(current)).toEqual({
      prose: [],
      writing: null,
      noting: { choosing: false, chosen: [], draft: "", canAdd: false },
    })
  })
})

describe("scene.fromViewer and fromPraxisBar", () => {
  it("opens the note by its highlight and closes it by its X", () => {
    const opened = scene.fromViewer(started(at(0, 1)), tap(0))
    expect(scene.viewer(opened.state).open).toBe(0)
    expect(scene.viewer(scene.fromViewer(opened.state, close).state).open).toBeNull()
  })

  it("gives back the very same state when nothing changed", () => {
    const current = started(at(0, 1))
    expect(scene.fromViewer(current, tap(1)).state).toBe(current) // no note 1 is shown
    expect(scene.fromPraxisBar(current, { kind: "submit" }).state).toBe(current) // nothing to write
  })

  it("writes in the notebook on Respond, and only then", () => {
    let current = started(at(0, 2))
    const typing = scene.fromPraxisBar(current, { kind: "draft", text: "Worms." })
    expect(typing.effects).toEqual([])
    current = typing.state
    const sent = scene.fromPraxisBar(current, { kind: "submit" })
    expect(sent.effects).toEqual([{ kind: "note", targets: [whole], tags: [], body: "Worms." }])
    expect(scene.praxisBar(sent.state)?.writing).toEqual({
      kind: "written",
      body: "Worms.",
      lemma: null,
    })
  })
})

describe("scene.fromFrame: cuts and holds", () => {
  it("does nothing when the frame names the very subject the scene is on: the open note stays", () => {
    const step = at(0, 1)
    const current = scene.fromViewer(started(step), tap(0)).state
    const answer = scene.fromFrame(current, subject(step))
    expect(answer.state).toBe(current)
    expect(answer.effects).toEqual([])
  })

  it("cuts to a new frame: a new key starts the scene again", () => {
    const current = scene.fromViewer(started(at(0, 0)), tap(0)).state
    const answer = scene.fromFrame(current, subject(at(0, 1)))
    expect(answer.state.subject.key).toBe("test/0/1")
    expect(scene.viewer(answer.state).open).toBeNull()
  })

  it("holds on the same frame when the notebook changes: the open note and the page carry on", () => {
    const written: ReaderNote = {
      id: "n" as NoteId,
      targets: [whole],
      tags: [],
      fingerprint: "f" as Fingerprint,
      body: "Worms.",
      from: { practice: "test", fingerprint: fingerprintOfPractice(practice), stage: 0, step: 2 },
      writtenAt: 0,
      revisedAt: null,
    }
    let current = started(at(0, 2))
    current = scene.fromPraxisBar(current, { kind: "draft", text: "Worms." }).state
    current = scene.fromPraxisBar(current, { kind: "submit" }).state
    // The notebook now has the note: the frame hands over a fresh subject with the same key
    current = scene.fromFrame(current, subject(at(0, 2, [written]))).state
    expect(scene.praxisBar(current)?.writing).toEqual({
      kind: "written",
      body: "Worms.",
      lemma: null,
    })
    current = scene.fromPraxisBar(current, { kind: "edit" }).state
    expect(scene.praxisBar(current)?.writing).toEqual({
      kind: "writing",
      draft: "Worms.",
      canSubmit: false,
      canCancel: true,
      passages: null,
    })
  })

  it("follows the frame through a practice: two steps, a page, the rest, the final stage", () => {
    let current = started(at(0, 0))
    expect(scene.viewer(current)).toEqual({
      kind: "marked",
      text: "poem",
      notes: setOf("a"),
      marked: [0],
      open: null,
      choosing: false,
      chosen: [],
    })
    current = scene.fromViewer(current, tap(0)).state

    current = scene.fromFrame(current, subject(at(0, 1))).state
    expect(scene.viewer(current)).toEqual({
      kind: "marked",
      text: "poem",
      notes: setOf("b"),
      marked: [0],
      open: null,
      choosing: false,
      chosen: [],
    })

    current = scene.fromFrame(current, subject(at(0, 2))).state
    expect(scene.praxisBar(current)?.writing?.kind).toBe("writing")

    current = scene.fromFrame(current, subject(at(0, 3))).state
    expect(scene.praxisBar(current)).toBeNull()

    current = scene.fromFrame(current, subject(at(1, 0))).state
    expect(scene.praxisBar(current)?.prose).toEqual(["You have finished!"])
  })

  it("follows a change of mode, to annotate mode and back to the practice", () => {
    const step = at(0, 1)
    let current = started(step)
    current = scene.fromFrame(current, subject(annotating([mine("n1", "Worms.")]))).state
    expect(scene.viewer(current).kind).toBe("listed")
    current = scene.fromViewer(current, tap(0)).state

    current = scene.fromFrame(current, subject(step)).state
    expect(scene.viewer(current)).toEqual({
      kind: "marked",
      text: "poem",
      notes: setOf("b"),
      marked: [0],
      open: null,
      choosing: false,
      chosen: [],
    })
  })
})

describe("annotate mode, as the notebook changes", () => {
  it("keeps the open note open when another note arrives", () => {
    let current = started(annotating([mine("n1", "Worms.")]))
    current = scene.fromViewer(current, tap(0)).state
    const more = annotating([mine("n1", "Worms."), mine("n2", "Beads.")])
    current = scene.fromFrame(current, subject(more)).state
    expect(scene.viewer(current)).toMatchObject({ shown: [0, 1], open: 0 })
  })

  it("closes the open note when the notebook is emptied", () => {
    let current = started(annotating([mine("n1", "Worms.")]))
    current = scene.fromViewer(current, tap(0)).state
    current = scene.fromFrame(current, subject(annotating([]))).state
    expect(scene.viewer(current)).toMatchObject({ shown: [], open: null })
  })
})

describe("noting in annotate mode", () => {
  const bird = { start: { line: 0, offset: 2 }, end: { line: 0, offset: 6 } }
  const choose = (span: typeof bird) => ({ kind: "choose", span }) as const
  const on = { kind: "choosing", on: true } as const

  it("chooses passages only once choosing is on, and draws them in the viewer", () => {
    let current = started(annotating([]))
    expect(scene.fromViewer(current, choose(bird)).state).toBe(current)
    current = scene.fromPraxisBar(current, on).state
    current = scene.fromViewer(current, choose(bird)).state
    expect(scene.viewer(current)).toMatchObject({ choosing: true, chosen: [bird] })
    expect(scene.praxisBar(current)?.noting?.chosen).toEqual([{ kind: "quote", text: "Bird" }])
  })

  it("writes nothing in the notebook, whatever the reader does", () => {
    let current = started(annotating([]))
    for (const message of [on, { kind: "noteDraft", text: "Worms." }] as const) {
      const answer = scene.fromPraxisBar(current, message)
      expect(answer.effects).toEqual([])
      current = answer.state
    }
    expect(scene.fromViewer(current, choose(bird)).effects).toEqual([])
  })

  it("keeps the toggle, the passages and the draft when the notebook changes", () => {
    let current = started(annotating([]))
    current = scene.fromPraxisBar(current, on).state
    current = scene.fromViewer(current, choose(bird)).state
    current = scene.fromPraxisBar(current, { kind: "noteDraft", text: "Worms." }).state
    current = scene.fromFrame(current, subject(annotating([mine("n1", "Beads.")]))).state
    expect(scene.praxisBar(current)?.noting).toMatchObject({ choosing: true, draft: "Worms." })
    expect(scene.viewer(current).chosen).toEqual([bird])
  })

  it("takes a note up: its passages chosen and drawn, its words in the box, the open note closed", () => {
    let current = started(annotating([mine("n1", "Worms.")]))
    current = scene.fromViewer(current, tap(0)).state
    const taken = scene.fromPraxisBar(current, { kind: "takeUp", targets: [bird], text: "A bird." })
    expect(taken.effects).toEqual([])
    expect(scene.viewer(taken.state)).toMatchObject({ chosen: [bird], open: null })
    expect(scene.praxisBar(taken.state)?.noting).toMatchObject({ draft: "A bird.", canAdd: true })
  })

  it("starts afresh after a change of mode, and has no noting in practice mode", () => {
    let current = started(annotating([]))
    current = scene.fromPraxisBar(current, on).state
    current = scene.fromFrame(current, subject(at(0, 1))).state
    expect(scene.viewer(current)).toMatchObject({ choosing: false, chosen: [] })
    expect(scene.praxisBar(current)?.noting).toBeNull()
    expect(scene.fromPraxisBar(current, on).state).toBe(current)
    expect(scene.fromViewer(current, choose(bird)).state).toBe(current)
    current = scene.fromFrame(current, subject(annotating([]))).state
    expect(scene.praxisBar(current)?.noting?.choosing).toBe(false)
  })
})

describe("annotate mode: notes added and deleted", () => {
  const remove = (id: string) => ({ kind: "deleteNote", id }) as const

  it("sends out the new note on Add note, and its withdrawal on Delete", () => {
    let current = started(annotating([mine("n1", "Worms.")]))
    const typed = scene.fromPraxisBar(current, { kind: "noteDraft", text: "Beads." })
    expect(typed.effects).toEqual([])
    const added = scene.fromPraxisBar(typed.state, { kind: "addNote" })
    expect(added.effects).toEqual([{ kind: "note", targets: [whole], tags: [], body: "Beads." }])
    current = scene.fromViewer(added.state, tap(0)).state
    const deleted = scene.fromViewer(current, remove("n1"))
    expect(deleted.effects).toEqual([{ kind: "withdraw", id: "n1" }])
    expect(scene.viewer(deleted.state).open).toBeNull()
  })

  it("keeps the same note open when a note before it is withdrawn, as in another tab", () => {
    let current = started(annotating([mine("a", "A."), mine("b", "B."), mine("c", "C.")]))
    current = scene.fromViewer(current, tap(1)).state
    current = scene.fromFrame(
      current,
      subject(annotating([mine("b", "B."), mine("c", "C.")])),
    ).state
    expect(current.open).toEqual({ index: 0, id: "b" })
    expect(scene.viewer(current).open).toBe(0)
  })

  it("keeps the same note open when a new note is added below it", () => {
    let current = started(annotating([mine("a", "A.")]))
    current = scene.fromViewer(current, tap(0)).state
    const open = current.open
    current = scene.fromFrame(
      current,
      subject(annotating([mine("a", "A."), mine("b", "B.")])),
    ).state
    expect(current.open).toBe(open)
  })

  it("closes a deleted note, rather than opening the note that takes its place", () => {
    let current = started(annotating([mine("a", "A."), mine("b", "B."), mine("c", "C.")]))
    current = scene.fromViewer(current, tap(1)).state
    current = scene.fromViewer(current, remove("b")).state
    current = scene.fromFrame(
      current,
      subject(annotating([mine("a", "A."), mine("c", "C.")])),
    ).state
    expect(scene.viewer(current).open).toBeNull()
  })
})

describe("annotate mode: turning to the new note closes the open one", () => {
  const bird = { start: { line: 0, offset: 2 }, end: { line: 0, offset: 6 } }
  const opened = () => scene.fromViewer(started(annotating([mine("a", "A.")])), tap(0)).state

  it("closes the open note on any message from the praxis bar to the noting", () => {
    for (const message of [
      { kind: "choosing", on: true },
      { kind: "noteDraft", text: "B" },
      { kind: "unchoose", index: 0 },
      { kind: "addNote" },
    ] as const) {
      const current = opened()
      expect(scene.viewer(current).open).toBe(0)
      expect(scene.viewer(scene.fromPraxisBar(current, message).state).open).toBeNull()
    }
  })

  it("closes the open note when a passage is chosen in the poem", () => {
    const choosing = scene.fromPraxisBar(opened(), { kind: "choosing", on: true }).state
    const current = scene.fromViewer(choosing, tap(0)).state
    expect(scene.viewer(current).open).toBe(0)
    const chosen = scene.fromViewer(current, { kind: "choose", span: bird }).state
    expect(scene.viewer(chosen).open).toBeNull()
    expect(scene.viewer(chosen).chosen).toEqual([bird])
  })

  it("keeps the very same scene when nothing changes and nothing is open", () => {
    const current = started(annotating([]))
    expect(scene.fromPraxisBar(current, { kind: "choosing", on: false }).state).toBe(current)
  })

  it("leaves practice mode's open note alone: its praxis bar speaks to the writing", () => {
    let current = started(at(0, 1))
    current = scene.fromViewer(current, tap(0)).state
    expect(scene.fromPraxisBar(current, { kind: "draft", text: "x" }).state).toBe(current)
  })
})

describe("a step asking for writing on chosen passages: the writing chooses them, not the noting", () => {
  const askChosen: Parts = {
    ...REST,
    prose: ["Where does the bird change?"],
    writing: { target: "chosen", tags: [], count: "one" },
  }
  const askingChosen = practiceOf({ ...practice, stages: [{ name: "Only", steps: [askChosen] }] })
  const bird = { start: { line: 0, offset: 2 }, end: { line: 0, offset: 6 } }
  const worm = { start: { line: 1, offset: 10 }, end: { line: 1, offset: 20 } }
  const from = {
    practice: "test",
    fingerprint: fingerprintOfPractice(askingChosen),
    stage: 0,
    step: 0,
  }
  const here = (written: readonly ReaderNote[] = []) =>
    frameOf(askingChosen, standing(0, 0), material, written).subject

  it("takes the toggle and each passage chosen, and the viewer draws them while writing", () => {
    let current = started(here())
    current = scene.fromPraxisBar(current, { kind: "choosing", on: true }).state
    current = scene.fromViewer(current, { kind: "choose", span: worm }).state
    current = scene.fromViewer(current, { kind: "choose", span: bird }).state
    expect(current.noting).toBeNull()
    expect(scene.viewer(current)).toMatchObject({ choosing: true, chosen: [bird, worm] })
    expect(scene.praxisBar(current)?.writing).toMatchObject({
      kind: "writing",
      passages: {
        choosing: true,
        chosen: [
          { kind: "quote", text: "Bird" },
          { kind: "quote", text: "Angle Worm" },
        ],
      },
    })
    current = scene.fromPraxisBar(current, { kind: "unchoose", index: 1 }).state
    expect(scene.viewer(current).chosen).toEqual([bird])
  })

  it("sends out the note on its passages, and once written draws nothing in the poem", () => {
    let current = started(here())
    current = scene.fromPraxisBar(current, { kind: "choosing", on: true }).state
    current = scene.fromViewer(current, { kind: "choose", span: bird }).state
    current = scene.fromPraxisBar(current, { kind: "draft", text: "Fed." }).state
    const sent = scene.fromPraxisBar(current, { kind: "submit" })
    expect(sent.effects).toEqual([{ kind: "note", targets: [bird], tags: [], body: "Fed." }])
    const back = mine("o", "Fed.", { targets: [bird], from })
    current = scene.fromFrame(sent.state, subject(here([back]))).state
    expect(scene.viewer(current)).toMatchObject({ choosing: false, chosen: [] })
    expect(scene.praxisBar(current)?.writing).toEqual({
      kind: "written",
      body: "Fed.",
      lemma: [{ kind: "quote", text: "Bird" }],
    })
  })

  it("Edit brings the passages back to the poem; a passage removed is sent out as a revision", () => {
    let current = started(here([mine("o", "Fed.", { targets: [bird, worm], from })]))
    current = scene.fromPraxisBar(current, { kind: "edit" }).state
    expect(scene.viewer(current)).toMatchObject({ choosing: false, chosen: [bird, worm] })
    current = scene.fromPraxisBar(current, { kind: "unchoose", index: 0 }).state
    expect(scene.fromPraxisBar(current, { kind: "submit" }).effects).toEqual([
      { kind: "revise", id: "o", targets: [worm], body: "Fed." },
    ])
  })

  it("finds only a note that can be placed on the poem", () => {
    const elsewhere = mine("x", "On other lines.", {
      targets: [bird],
      from,
      fingerprint: "g" as Fingerprint,
    })
    expect(scene.praxisBar(started(here([elsewhere])))?.writing).toMatchObject({
      kind: "writing",
      draft: "",
    })
  })
})

describe("a step asking for writing on the whole poem: no passages to choose", () => {
  it("ignores the toggle and a passage chosen, and draws none", () => {
    const current = started(at(0, 2))
    const bird = { start: { line: 0, offset: 2 }, end: { line: 0, offset: 6 } }
    expect(scene.fromPraxisBar(current, { kind: "choosing", on: true }).state).toBe(current)
    expect(scene.fromViewer(current, { kind: "choose", span: bird }).state).toBe(current)
    expect(scene.viewer(current)).toMatchObject({ choosing: false, chosen: [] })
  })
})

describe("a recall step: the stage before's notes, listed to read", () => {
  const recalling = practiceOf({
    ...practice,
    stages: [
      { name: "First", steps: [look("a"), askWhole] },
      {
        name: "Second",
        steps: [
          { ...REST, prose: ["Yesterday, you wrote:"], recall: { from: "stage", id: "stage-1" } },
        ],
      },
    ],
  })
  const from = {
    practice: "test",
    fingerprint: fingerprintOfPractice(recalling),
    stage: 0,
    step: 1,
  }
  const answered = mine("r", "Worms.", { from })
  const here = () => frameOf(recalling, standing(1, 0), material, [answered]).subject

  it("lists them, none open, with the prompt each answered, and nothing to delete", () => {
    expect(scene.viewer(started(here()))).toEqual({
      kind: "listed",
      text: "poem",
      notes: expect.anything(),
      shown: [0],
      open: null,
      deletable: false,
      recalled: [{ prompt: ["What does the bird eat?"], whole: true, heading: "First" }],
      choosing: false,
      chosen: [],
    })
  })

  it("opens a note by a tap, and ignores a delete", () => {
    let current = started(here())
    current = scene.fromViewer(current, tap(0)).state
    expect(scene.viewer(current).open).toBe(0)
    const deleted = scene.fromViewer(current, { kind: "deleteNote", id: "r" })
    expect(deleted.effects).toEqual([])
    expect(deleted.state).toBe(current)
  })

  it("puts nothing of its own in the praxis bar but the prose", () => {
    expect(scene.praxisBar(started(here()))).toEqual({
      prose: ["Yesterday, you wrote:"],
      writing: null,
      noting: null,
    })
  })
})

describe("the final stage: every response, listed to read", () => {
  const from = { practice: "test", fingerprint: fingerprintOfPractice(practice), stage: 0, step: 2 }
  const answered = mine("r", "Worms.", { from })
  const final = () => frameOf(practice, standing(1, 0), material, [answered]).subject

  it("lists them under their stage's name, none open, with nothing to delete", () => {
    expect(scene.viewer(started(final()))).toMatchObject({
      kind: "listed",
      shown: [0],
      open: null,
      deletable: false,
      recalled: [{ prompt: ["What does the bird eat?"], whole: true, heading: "Only" }],
    })
  })

  it("opens a note by a tap, and ignores a delete", () => {
    const current = scene.fromViewer(started(final()), tap(0)).state
    expect(scene.viewer(current).open).toBe(0)
    const deleted = scene.fromViewer(current, { kind: "deleteNote", id: "r" })
    expect(deleted.effects).toEqual([])
    expect(deleted.state).toBe(current)
  })
})

describe("a step that only says something: the poem, and the editor's prompt", () => {
  const saying = practiceOf({
    ...practice,
    stages: [{ name: "Only", steps: [{ ...REST, prose: ["Read the poem through."] }] }],
  })
  const here = () => frameOf(saying, standing(0, 0), material, []).subject

  it("draws the poem with nothing picked out, and only the prompt in the praxis bar", () => {
    const current = started(here())
    expect(scene.viewer(current)).toEqual({
      kind: "marked",
      text: "poem",
      notes: setOf(),
      marked: [],
      open: null,
      choosing: false,
      chosen: [],
    })
    expect(scene.praxisBar(current)).toEqual({
      prose: ["Read the poem through."],
      writing: null,
      noting: null,
    })
  })

  it("has no passages to choose and nothing to write: every such message changes nothing", () => {
    const current = started(here())
    const bird = { start: { line: 0, offset: 2 }, end: { line: 0, offset: 6 } }
    expect(scene.fromViewer(current, { kind: "choose", span: bird }).state).toBe(current)
    expect(scene.fromPraxisBar(current, { kind: "choosing", on: true }).state).toBe(current)
    const typed = scene.fromPraxisBar(current, { kind: "draft", text: "Worms." })
    expect(typed.state).toBe(current)
    expect(scene.fromPraxisBar(current, { kind: "submit" }).effects).toEqual([])
  })
})
