import { assertNever } from "../../assertNever"
import { keepOpen, onViewer, viewerOf, type OpenNote } from "./parts/commentary"
import {
  notingOf,
  onChoose,
  onPraxisBar as onNotingBar,
  startNoting,
  type NotingState,
} from "./parts/noting"
import {
  keepWriting,
  onPraxisBar,
  startWriting,
  writingOf,
  type WritingState,
} from "./parts/writing"
import { reply } from "./reply"
import type {
  FrameProtocol,
  NotingMessage,
  PraxisBarProjection,
  PraxisBarProtocol,
  Reply,
  Subject,
  ViewerProjection,
  ViewerProtocol,
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
    const writing = subject.writing === null ? null : startWriting(subject.writing)
    const noting = subject.noting === null ? null : startNoting()
    return reply({ subject, open: null, writing, noting })
  },

  /** The frame's new subject. The very same subject changes nothing. A new key starts the scene
   * afresh. The same key keeps the parts' state, brought up to date with what changed around them. */
  fromFrame(current: SceneState, message: FrameProtocol["toScene"]): Reply<SceneState> {
    const { subject } = message
    if (subject === current.subject) return reply(current)
    if (subject.key !== current.subject.key) return scene.start(subject)
    const before = current.subject.writing
    const writing =
      subject.writing === null
        ? null
        : before === null || current.writing === null
          ? startWriting(subject.writing)
          : keepWriting(before, subject.writing, current.writing)
    const noting = subject.noting === null ? null : (current.noting ?? startNoting())
    return reply({ subject, open: keepOpen(subject.commentary, current.open), writing, noting })
  },

  /** The viewer speaks to the commentary, which may withdraw a note from the notebook, and a chosen
   * passage to the noting, which also closes the open note. */
  fromViewer(current: SceneState, message: ViewerProtocol["toScene"]): Reply<SceneState> {
    if (message.kind === "choose") {
      const { noting } = current.subject
      if (noting === null || current.noting === null) return reply(current)
      return reply(withNoting(current, onChoose(noting, current.noting, message.span)))
    }
    const answer = onViewer(current.subject.commentary, current.open, message)
    const state = answer.open === current.open ? current : { ...current, open: answer.open }
    return reply(state, answer.effects)
  },

  /** The praxis bar speaks to the writing or to the noting, either of which may write in the
   * notebook. Speaking to the noting also closes the open note. */
  fromPraxisBar(current: SceneState, message: PraxisBarProtocol["toScene"]): Reply<SceneState> {
    if (isNoting(message)) {
      const { noting } = current.subject
      if (noting === null || current.noting === null) return reply(current)
      const answer = onNotingBar(noting, current.noting, message)
      return reply(withNoting(current, answer.state), answer.effects)
    }
    const { writing } = current.subject
    if (writing === null || current.writing === null) return reply(current)
    const answer = onPraxisBar(writing, current.writing, message)
    const state = answer.state === current.writing ? current : { ...current, writing: answer.state }
    return reply(state, answer.effects)
  },

  /** The commentary's notes, and the noting's choosing and targets: none without noting. */
  viewer(current: SceneState): ViewerProjection {
    const commentary = viewerOf(current.subject.text, current.subject.commentary, current.open)
    return {
      ...commentary,
      choosing: current.noting?.choosing ?? false,
      chosen: current.noting?.targets ?? [],
    }
  },

  /** The prose, the writing and the noting; nothing at all when there is none, as at the rest. */
  praxisBar(current: SceneState): PraxisBarProjection | null {
    const { prose, writing, noting } = current.subject
    const page =
      writing === null || current.writing === null ? null : writingOf(writing, current.writing)
    const note =
      noting === null || current.noting === null ? null : notingOf(noting, current.noting)
    if (prose.length === 0 && page === null && note === null) return null
    return { prose, writing: page, noting: note }
  },
}

/** The scene once the noting has answered: its new state, and the open note closed, since the reader
 * has turned to the new note. Nothing changed gives back the very same scene. */
function withNoting(current: SceneState, noting: NotingState): SceneState {
  if (noting === current.noting && current.open === null) return current
  return { ...current, noting, open: null }
}

/** Whether a message from the praxis bar is for the noting, rather than the writing. */
function isNoting(message: PraxisBarProtocol["toScene"]): message is NotingMessage {
  switch (message.kind) {
    case "choosing":
    case "unchoose":
    case "noteDraft":
    case "addNote":
      return true
    case "draft":
    case "submit":
    case "edit":
    case "cancel":
      return false
    default:
      return assertNever(message)
  }
}
