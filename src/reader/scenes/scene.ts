import { assertNever } from "../../assertNever"
import type { Span } from "../../material/types"
import { keepOpen, onViewer, viewerOf, type OpenNote } from "./parts/commentary"
import * as noting from "./parts/noting"
import type { NotingState } from "./parts/noting"
import * as writing from "./parts/writing"
import type { WritingState } from "./parts/writing"
import type { Passages } from "./passages"
import { reply } from "./reply"
import type {
  Asks,
  FrameProtocol,
  NotingSubject,
  PassageMessage,
  PraxisBarProjection,
  PraxisBarProtocol,
  Reply,
  Subject,
  ViewerProjection,
  ViewerProtocol,
  WritingSubject,
} from "./types"

export interface SceneState {
  readonly subject: Subject
  /** The note the reader has opened, if any. */
  readonly open: OpenNote | null
  /** The writing, when the subject asks for it. */
  readonly writing: WritingState | null
  /** The new note, when the subject has noting. */
  readonly noting: NotingState | null
}

export const scene = {
  /** The scene started afresh on a subject. */
  start(subject: Subject): Reply<SceneState> {
    const page = subject.writing === null ? null : writing.startWriting(subject.writing)
    const note = subject.noting === null ? null : noting.startNoting()
    return reply({ subject, open: null, writing: page, noting: note })
  },

  /** The frame's new subject. The very same subject changes nothing. A new key starts the scene
   * afresh. The same key keeps the parts' state, brought up to date with what changed around them. */
  fromFrame(current: SceneState, message: FrameProtocol["toScene"]): Reply<SceneState> {
    const { subject } = message
    if (subject === current.subject) return reply(current)
    if (subject.key !== current.subject.key) return scene.start(subject)
    const before = current.subject.writing
    const page =
      subject.writing === null
        ? null
        : before === null || current.writing === null
          ? writing.startWriting(subject.writing)
          : writing.keepWriting(before, subject.writing, current.writing)
    const note = subject.noting === null ? null : (current.noting ?? noting.startNoting())
    return reply({
      subject,
      open: keepOpen(subject.commentary, current.open),
      writing: page,
      noting: note,
    })
  },

  /** The viewer speaks to the commentary, which may withdraw a note from the notebook, and a chosen
   * passage to the part that chooses passages: the writing, or the noting, which then also closes
   * the open note. */
  fromViewer(current: SceneState, message: ViewerProtocol["toScene"]): Reply<SceneState> {
    if (message.kind === "choose") return reply(chosen(current, message.span))
    const answer = onViewer(current.subject.commentary, current.open, message)
    const state = answer.open === current.open ? current : { ...current, open: answer.open }
    return reply(state, answer.effects)
  },

  /** The praxis bar speaks to the writing, to the noting, or about passages to the part that
   * chooses them; the writing and the noting may write in the notebook. Speaking to the noting also
   * closes the open note. */
  fromPraxisBar(current: SceneState, message: PraxisBarProtocol["toScene"]): Reply<SceneState> {
    switch (message.kind) {
      case "draft":
      case "submit":
      case "edit":
      case "cancel": {
        const subject = current.subject.writing
        if (subject === null || current.writing === null) return reply(current)
        const answer = writing.onPraxisBar(subject, current.writing, message)
        return reply(withWriting(current, answer.state), answer.effects)
      }
      case "noteDraft":
      case "addNote":
      case "takeUp": {
        const subject = current.subject.noting
        if (subject === null || current.noting === null) return reply(current)
        const answer = noting.onPraxisBar(subject, current.noting, message)
        return reply(withNoting(current, answer.state), answer.effects)
      }
      case "choosing":
      case "unchoose":
        return reply(passagesAfter(current, message))
      default:
        return assertNever(message)
    }
  },

  /** The commentary's notes; and the passages being chosen, and whether choosing is on, from the
   * part that chooses them: none when no part does. */
  viewer(current: SceneState): ViewerProjection {
    const commentary = viewerOf(current.subject.text, current.subject.commentary, current.open)
    const passages = choosingOf(current)
    return {
      ...commentary,
      choosing: passages?.choosing ?? false,
      chosen: passages?.targets ?? [],
    }
  },

  /** The prose, the writing and the noting; nothing at all when there is none, as at the rest. */
  praxisBar(current: SceneState): PraxisBarProjection | null {
    const { prose } = current.subject
    const page =
      current.subject.writing === null || current.writing === null
        ? null
        : writing.writingOf(current.subject.writing, current.writing)
    const note =
      current.subject.noting === null || current.noting === null
        ? null
        : noting.notingOf(current.subject.noting, current.noting)
    if (prose.length === 0 && page === null && note === null) return null
    return { asks: asksOf(current.subject), prose, writing: page, noting: note }
  },
}

/** What a subject asks of the reader besides its prose, from its parts: writing first, then a
 * recall, then the editor's notes picked out; nothing with a noting; otherwise only reading. */
export function asksOf(subject: Subject): Asks {
  if (subject.noting !== null) return null
  if (subject.writing !== null) return "write"
  if (subject.commentary.recalled !== null) return "recall"
  if (subject.commentary.shown === "marked" && subject.commentary.notes.length > 0) return "notes"
  return "read"
}

/** The part that chooses passages, with its subject and state. */
type Chooser =
  | { readonly kind: "writing"; readonly subject: WritingSubject; readonly state: WritingState }
  | { readonly kind: "noting"; readonly subject: NotingSubject; readonly state: NotingState }

/** Which part chooses passages: the writing, while its note is on passages the reader chooses;
 * otherwise the noting, if the subject has it; otherwise none. */
function chooserOf(current: SceneState): Chooser | null {
  const { writing: page, noting: note } = current.subject
  if (page !== null && page.about.kind === "chosen" && current.writing !== null) {
    return { kind: "writing", subject: page, state: current.writing }
  }
  if (note !== null && current.noting !== null) {
    return { kind: "noting", subject: note, state: current.noting }
  }
  return null
}

/** A passage chosen in the viewer, for the part that chooses passages. */
function chosen(current: SceneState, span: Span): SceneState {
  const part = chooserOf(current)
  if (part === null) return current
  switch (part.kind) {
    case "writing":
      return withWriting(current, writing.onChoose(part.subject, part.state, span))
    case "noting":
      return withNoting(current, noting.onChoose(part.subject, part.state, span))
    default:
      return assertNever(part)
  }
}

/** The toggle for choosing, or − on a chosen target, for the part that chooses passages. */
function passagesAfter(current: SceneState, message: PassageMessage): SceneState {
  const part = chooserOf(current)
  if (part === null) return current
  switch (part.kind) {
    case "writing":
      return withWriting(current, writing.onPassages(part.state, message))
    case "noting":
      return withNoting(current, noting.onPassages(part.state, message))
    default:
      return assertNever(part)
  }
}

/** The passages being chosen, for the viewer to draw, from the part that chooses them. */
function choosingOf(current: SceneState): Passages | null {
  const part = chooserOf(current)
  if (part === null) return null
  switch (part.kind) {
    case "writing":
      return writing.choosingOf(part.state)
    case "noting":
      return part.state
    default:
      return assertNever(part)
  }
}

/** The scene once the writing has answered. Nothing changed gives back the very same scene. */
function withWriting(current: SceneState, page: WritingState): SceneState {
  return page === current.writing ? current : { ...current, writing: page }
}

/** The scene once the noting has answered: its new state, and the open note closed, since the reader
 * has turned to the new note. Nothing changed gives back the very same scene. */
function withNoting(current: SceneState, note: NotingState): SceneState {
  if (note === current.noting && current.open === null) return current
  return { ...current, noting: note, open: null }
}
