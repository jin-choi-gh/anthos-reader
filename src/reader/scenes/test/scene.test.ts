import { describe, expect, it } from "vitest"
import type { Material } from "../../../material/materials"
import type { Fingerprint } from "../../../material/types"
import type { NoteId, ReaderNote } from "../../../notebook/types"
import { fingerprintOfPractice } from "../../../practice/fingerprint"
import { REST } from "../../../practice/parts"
import type { EditorsNote, Parts } from "../../../practice/types"
import type { Standing } from "../../../runner/types"
import { annotateFrame, frameOf } from "../../frame/frame"
import { asksOf, scene, type SceneState } from "../scene"
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
  words: [],
  fingerprint: "f" as Fingerprint,
  poem: { title: "Fixture", author: "", stanzas: [] },
}

/** The editor's notes the practice's steps disclose, by their ids. */
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

/** A step that discloses one of the editor's notes. */
const look = (id: string): Parts => ({
  ...REST,
  prose: [`On ${id}.`],
  disclose: [editorsNotes[id]!],
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

/** The subject of a frame of the practice, with what is in the notebook: the reader held nowhere,
 * so its notes are disclosed already, as when the reader comes back to it. */
const at = (stage: number, step: number, written: readonly ReaderNote[] = []) =>
  frameOf(practice, standing(stage, step), material, written).subject

/** The subject of a step of the practice the reader is held at: its notes still to disclose. */
const heldAt = (stage: number, step: number) =>
  frameOf(practice, standing(stage, step, null, step), material, []).subject

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
  it("on a step with an editor's note still to disclose: none disclosed, none open; the prose", () => {
    const current = started(heldAt(0, 1))
    expect(scene.viewer(current)).toEqual({
      kind: "disclosed",
      text: "poem",
      notes: setOf("b"),
      open: null,
      choosing: false,
      chosen: [],
      restore: null,
      picking: null,
    })
    expect(scene.praxisBar(current)).toEqual({
      asks: "disclose",
      prose: ["On b."],
      writing: null,
      noting: null,
      disclosure: { key: "test/0/1", notes: [], current: null, more: true, count: 1 },
      restore: null,
    })
  })

  it("on a step with an editor's note disclosed already: every note disclosed, the first open", () => {
    const current = started(at(0, 1))
    expect(scene.viewer(current)).toMatchObject({ kind: "disclosed", open: 0 })
    expect(scene.praxisBar(current)?.disclosure).toEqual({
      key: "test/0/1",
      notes: [{ index: 0, lemma: [{ kind: "quote", text: "Worm" }], paragraphs: ["On the worm."] }],
      current: 0,
      more: false,
      count: 1,
    })
  })

  it("on a step asking for writing: the poem with nothing picked out; the prose and a blank page", () => {
    const current = started(at(0, 2))
    expect(scene.viewer(current)).toEqual({
      kind: "disclosed",
      text: "poem",
      notes: setOf(),
      open: null,
      choosing: false,
      chosen: [],
      restore: null,
      picking: null,
    })
    expect(scene.praxisBar(current)).toEqual({
      asks: "write",
      prose: ["What does the bird eat?"],
      writing: {
        kind: "writing",
        draft: "",
        canSubmit: false,
        canCancel: false,
        passages: null,
      },
      noting: null,
      disclosure: null,
      restore: null,
    })
  })

  it("at the rest: the poem with nothing picked out, and nothing of its own in the praxis bar", () => {
    const current = started(at(0, 3))
    expect(scene.viewer(current)).toEqual({
      kind: "disclosed",
      text: "poem",
      notes: setOf(),
      open: null,
      choosing: false,
      chosen: [],
      restore: null,
      picking: null,
    })
    expect(scene.praxisBar(current)).toBeNull()
  })

  it("in the final stage: the poem, and word that the practice is done", () => {
    expect(scene.praxisBar(started(at(1, 0)))).toEqual({
      asks: "recall",
      prose: ["Explicit."],
      writing: null,
      noting: null,
      disclosure: null,
      restore: null,
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
      restore: null,
      picking: null,
    })
    expect(scene.praxisBar(current)).toEqual({
      asks: null,
      prose: [],
      writing: null,
      noting: { choosing: false, chosen: [], draft: "", canAdd: false },
      disclosure: null,
      restore: null,
    })
  })
})

describe("scene.fromViewer and fromPraxisBar", () => {
  it("takes no tap or X on notes disclosed: only the praxis bar opens them", () => {
    const current = started(at(0, 1))
    expect(scene.fromViewer(current, tap(0)).state).toBe(current)
    expect(scene.fromViewer(current, close).state).toBe(current)
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
    const current = scene.fromPraxisBar(started(heldAt(0, 0)), { kind: "disclose" }).state
    expect(scene.viewer(current).open).toBe(0)
    const answer = scene.fromFrame(current, subject(heldAt(0, 1)))
    expect(answer.state.subject.key).toBe("test/0/1")
    expect(scene.viewer(answer.state).open).toBeNull()
    expect(scene.praxisBar(answer.state)?.disclosure?.notes).toEqual([])
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
      kind: "disclosed",
      text: "poem",
      notes: setOf("a"),
      open: 0,
      choosing: false,
      chosen: [],
      restore: null,
      picking: null,
    })

    current = scene.fromFrame(current, subject(at(0, 1))).state
    expect(scene.viewer(current)).toEqual({
      kind: "disclosed",
      text: "poem",
      notes: setOf("b"),
      open: 0,
      choosing: false,
      chosen: [],
      restore: null,
      picking: null,
    })

    current = scene.fromFrame(current, subject(at(0, 2))).state
    expect(scene.praxisBar(current)?.writing?.kind).toBe("writing")

    current = scene.fromFrame(current, subject(at(0, 3))).state
    expect(scene.praxisBar(current)).toBeNull()

    current = scene.fromFrame(current, subject(at(1, 0))).state
    expect(scene.praxisBar(current)?.prose).toEqual(["Explicit."])
  })

  it("follows a change of mode, to annotate mode and back to the practice", () => {
    const step = at(0, 1)
    let current = started(step)
    current = scene.fromFrame(current, subject(annotating([mine("n1", "Worms.")]))).state
    expect(scene.viewer(current).kind).toBe("listed")
    current = scene.fromViewer(current, tap(0)).state

    current = scene.fromFrame(current, subject(step)).state
    expect(scene.viewer(current)).toEqual({
      kind: "disclosed",
      text: "poem",
      notes: setOf("b"),
      open: 0,
      choosing: false,
      chosen: [],
      restore: null,
      picking: null,
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
      restore: null,
      picking: null,
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
      asks: "recall",
      prose: ["Yesterday, you wrote:"],
      writing: null,
      noting: null,
      disclosure: null,
      restore: null,
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
      kind: "disclosed",
      text: "poem",
      notes: setOf(),
      open: null,
      choosing: false,
      chosen: [],
      restore: null,
      picking: null,
    })
    expect(scene.praxisBar(current)).toEqual({
      asks: "read",
      prose: ["Read the poem through."],
      writing: null,
      noting: null,
      disclosure: null,
      restore: null,
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

describe("asksOf: what a subject asks of the reader besides its prose", () => {
  it("asks to disclose the editor's notes, to write, or only to read, by its parts", () => {
    expect(asksOf(at(0, 0))).toBe("disclose")
    expect(asksOf(at(0, 2))).toBe("write")
    expect(asksOf(at(0, 3))).toBe("read") // the rest: nothing said, nothing asked
  })

  it("asks nothing with a noting, as in annotate mode", () => {
    expect(asksOf(annotating([]))).toBeNull()
  })
})

describe("the scene on a step that restores", () => {
  const game: Parts = {
    ...REST,
    prose: ["Put them back."],
    restore: { of: "words", gaps: ["l2 Worm", "l1 Bird"] },
  }
  const restoring = practiceOf({
    id: "restoring",
    title: "Restoring",
    text: "poem",
    stages: [{ name: "Only", steps: [look("a"), game] }],
  })
  /** The game's subject: held at it, not yet restored; or not held, restored. */
  const playing = frameOf(restoring, standing(0, 1, null, 1), material, []).subject
  const won = frameOf(restoring, standing(0, 1), material, []).subject
  const take = (slip: number) => ({ kind: "take", slip }) as const
  const check = { kind: "check" } as const

  it("asks the reader to restore, and lies every slip in the praxis bar, none in a gap", () => {
    expect(asksOf(playing)).toBe("restore")
    expect(scene.praxisBar(started(playing))).toEqual({
      asks: "restore",
      prose: ["Put them back."],
      writing: null,
      noting: null,
      disclosure: null,
      restore: {
        of: "words",
        slips: [
          { text: "Bird", placed: false, restored: false },
          { text: "Worm", placed: false, restored: false },
        ],
        canCheck: false,
        restored: 0,
        gaps: 2,
        returned: null,
        whole: false,
      },
    })
  })

  it("never tells the viewer what an empty gap takes out", () => {
    const viewer = scene.viewer(started(playing))
    expect(viewer.restore).toEqual({
      of: "words",
      next: 0,
      gaps: [
        { state: "empty", span: { start: { line: 0, offset: 2 }, end: { line: 0, offset: 6 } } },
        { state: "empty", span: { start: { line: 1, offset: 16 }, end: { line: 1, offset: 20 } } },
      ],
    })
    expect(JSON.stringify(viewer)).not.toMatch(/Bird|Worm/)
  })

  it("plays a game through: wrong, given back, right, and the step restored, sent out once", () => {
    let current = started(playing)
    const send = (message: Parameters<typeof scene.fromPraxisBar>[1]) => {
      const answer = scene.fromPraxisBar(current, message)
      current = answer.state
      return answer.effects
    }
    expect(send(take(1))).toEqual([])
    expect(send(take(0))).toEqual([])
    expect(scene.viewer(current).restore?.gaps.map((gap) => gap.state)).toEqual([
      "filled",
      "filled",
    ])
    expect(send(check)).toEqual([])
    expect(scene.praxisBar(current)?.restore).toMatchObject({ returned: 2, restored: 0 })
    expect(scene.viewer(current).restore?.next).toBe(0)

    // A filled gap tapped in the viewer gives its slip back
    expect(send(take(1))).toEqual([])
    current = scene.fromViewer(current, { kind: "empty", gap: 0 }).state
    expect(scene.praxisBar(current)?.restore?.slips.every((slip) => !slip.placed)).toBe(true)

    expect(send(take(0))).toEqual([])
    expect(send(take(1))).toEqual([])
    expect(send(check)).toEqual([{ kind: "restored" }])
    expect(send(check)).toEqual([])
    expect(scene.praxisBar(current)?.restore).toMatchObject({ whole: true, restored: 2 })
  })

  it("keeps the game when the frame's subject is fresh but the same, and makes it whole once restored", () => {
    let current = scene.fromPraxisBar(started(playing), take(1)).state
    const again = frameOf(restoring, standing(0, 1, null, 1), material, []).subject
    current = scene.fromFrame(current, subject(again)).state
    expect(scene.viewer(current).restore?.gaps[0]).toMatchObject({ state: "filled", text: "Worm" })
    current = scene.fromFrame(current, subject(won)).state
    expect(scene.praxisBar(current)?.restore?.whole).toBe(true)
    expect(scene.viewer(current).restore?.gaps.map((gap) => gap.state)).toEqual([
      "restored",
      "restored",
    ])
  })

  it("starts the game afresh on another step and back", () => {
    let current = scene.fromPraxisBar(started(playing), take(1)).state
    current = scene.fromFrame(current, subject(at(0, 0))).state
    current = scene.fromFrame(current, subject(playing)).state
    expect(scene.viewer(current).restore?.gaps.map((gap) => gap.state)).toEqual(["empty", "empty"])
  })

  it("shows a step restored already whole, with the poem's own words", () => {
    expect(scene.viewer(started(won)).restore?.gaps).toEqual([
      expect.objectContaining({ state: "restored", text: "Bird" }),
      expect.objectContaining({ state: "restored", text: "Worm" }),
    ])
  })

  it("has no restore on any other step", () => {
    const current = started(at(0, 1))
    expect(scene.viewer(current).restore).toBeNull()
    expect(scene.praxisBar(current)?.restore).toBeNull()
  })
})

describe("the scene with a picking, as Form Practice has one", () => {
  const picking: Subject = {
    ...at(0, 0),
    commentary: { ...at(0, 0).commentary, notes: [] },
    picking: {
      of: "words",
      units: [
        { span: { start: { line: 0, offset: 0 }, end: { line: 0, offset: 1 } }, taken: false },
        { span: { start: { line: 0, offset: 2 }, end: { line: 0, offset: 6 } }, taken: true },
      ],
    },
  }

  it("draws each word to pick, and asks nothing of a reader", () => {
    const current = started(picking)
    expect(scene.viewer(current).picking).toEqual({ of: "words", units: picking.picking!.units })
    expect(asksOf(picking)).toBeNull()
  })

  it("sends a word picked in the viewer out, by its span, changing nothing of its own", () => {
    const current = started(picking)
    const answer = scene.fromViewer(current, { kind: "pick", unit: 1 })
    expect(answer.state).toBe(current)
    expect(answer.effects).toEqual([
      { kind: "pick", span: { start: { line: 0, offset: 2 }, end: { line: 0, offset: 6 } } },
    ])
  })

  it("sends nothing out for a pick where there is no picking", () => {
    const current = started(at(0, 0))
    expect(scene.fromViewer(current, { kind: "pick", unit: 0 }).effects).toEqual([])
  })
})

describe("the scene on a step that discloses", () => {
  const two: Parts = {
    ...REST,
    prose: ["Read them."],
    disclose: [editorsNotes.b!, editorsNotes.a!],
  }
  const disclosing = practiceOf({
    id: "disclosing",
    title: "Disclosing",
    text: "poem",
    stages: [{ name: "Only", steps: [two] }],
  })
  /** The step's subject: held at it, its notes still to disclose; or not held, disclosed. */
  const reading = frameOf(disclosing, standing(0, 0, null, 0), material, []).subject
  const read = frameOf(disclosing, standing(0, 0), material, []).subject
  const disclose = { kind: "disclose" } as const
  const turn = (note: number) => ({ kind: "turn", note }) as const

  it("discloses the notes in the step's order, each opened, and sends out the last, once", () => {
    let current = started(reading)
    const first = scene.fromPraxisBar(current, disclose)
    expect(first.effects).toEqual([])
    current = first.state
    expect(scene.viewer(current).open).toBe(0)
    expect(scene.praxisBar(current)?.disclosure).toMatchObject({ current: 0, more: true, count: 2 })
    expect(scene.praxisBar(current)?.disclosure?.notes.map((note) => note.index)).toEqual([0])

    const last = scene.fromPraxisBar(current, disclose)
    expect(last.effects).toEqual([{ kind: "disclosed" }])
    current = last.state
    expect(scene.viewer(current).open).toBe(1)
    expect(scene.praxisBar(current)?.disclosure).toMatchObject({ current: 1, more: false })

    const again = scene.fromPraxisBar(current, disclose)
    expect(again.state).toBe(current)
    expect(again.effects).toEqual([])
  })

  it("draws only the open note's words, the one being read, in the poem", () => {
    const current = scene.fromPraxisBar(started(reading), disclose).state
    expect(scene.viewer(current)).toEqual({
      kind: "disclosed",
      text: "poem",
      notes: expect.objectContaining({ notes: expect.any(Array) }),
      open: 0,
      choosing: false,
      chosen: [],
      restore: null,
      picking: null,
    })
  })

  it("turns to a note disclosed, but not to one still to come, nor the one open", () => {
    let current = scene.fromPraxisBar(started(reading), disclose).state
    expect(scene.fromPraxisBar(current, turn(1)).state).toBe(current)
    expect(scene.fromPraxisBar(current, turn(0)).state).toBe(current)
    current = scene.fromPraxisBar(current, disclose).state
    const back = scene.fromPraxisBar(current, turn(0))
    expect(back.effects).toEqual([])
    expect(scene.viewer(back.state).open).toBe(0)
    expect(scene.praxisBar(back.state)?.disclosure).toMatchObject({ current: 0, more: false })
  })

  it("comes back to a step disclosed already with every note disclosed, the first open, and sends out nothing more", () => {
    const current = started(read)
    expect(scene.praxisBar(current)?.disclosure).toMatchObject({ current: 0, more: false })
    expect(scene.praxisBar(current)?.disclosure?.notes).toHaveLength(2)
    expect(scene.fromPraxisBar(current, disclose).state).toBe(current)
  })

  it("keeps what is disclosed when the frame hands over a fresh subject for the step", () => {
    let current = scene.fromPraxisBar(started(reading), disclose).state
    const fresh = frameOf(disclosing, standing(0, 0, null, 0), material, []).subject
    current = scene.fromFrame(current, subject(fresh)).state
    expect(scene.praxisBar(current)?.disclosure).toMatchObject({ current: 0, more: true })
  })

  it("keeps the open note once the step is disclosed, as after its own last note is logged", () => {
    let current = started(reading)
    current = scene.fromPraxisBar(current, disclose).state
    current = scene.fromPraxisBar(current, disclose).state
    current = scene.fromPraxisBar(current, turn(0)).state
    current = scene.fromFrame(current, subject(read)).state
    expect(scene.praxisBar(current)?.disclosure).toMatchObject({ current: 0, more: false })
  })

  it("discloses every note when another tab has the step disclosed partway through", () => {
    let current = scene.fromPraxisBar(started(reading), disclose).state
    current = scene.fromFrame(current, subject(read)).state
    expect(scene.praxisBar(current)?.disclosure?.notes).toHaveLength(2)
    expect(scene.praxisBar(current)?.disclosure).toMatchObject({ current: 0, more: false })
  })

  it("starts afresh when the step is no longer disclosed, as when its run is forgotten", () => {
    let current = started(read)
    current = scene.fromFrame(current, subject(reading)).state
    expect(scene.praxisBar(current)?.disclosure).toMatchObject({ notes: [], current: null })
  })
})
