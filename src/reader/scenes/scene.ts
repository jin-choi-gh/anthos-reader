import { assertNever } from "../../assertNever"
import { keepOpen, onViewer, viewerOf } from "./parts/commentary"
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
  /** The editor's note the reader has opened, by its index. */
  readonly open: number | null
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

  /** The viewer speaks to the commentary, and a chosen passage to the noting. */
  fromViewer(current: SceneState, message: ViewerProtocol["toScene"]): Reply<SceneState> {
    if (message.kind === "choose") {
      const { noting } = current.subject
      if (noting === null || current.noting === null) return reply(current)
      const next = onChoose(noting, current.noting, message.span)
      return reply(next === current.noting ? current : { ...current, noting: next })
    }
    const open = onViewer(current.subject.commentary, current.open, message)
    return reply(open === current.open ? current : { ...current, open })
  },

  /** The praxis bar speaks to the writing, which may write in the notebook, or to the noting. */
  fromPraxisBar(current: SceneState, message: PraxisBarProtocol["toScene"]): Reply<SceneState> {
    if (isNoting(message)) {
      if (current.noting === null) return reply(current)
      const next = onNotingBar(current.noting, message)
      return reply(next === current.noting ? current : { ...current, noting: next })
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

/** Whether a message from the praxis bar is for the noting, rather than the writing. */
function isNoting(message: PraxisBarProtocol["toScene"]): message is NotingMessage {
  switch (message.kind) {
    case "choosing":
    case "unchoose":
    case "noteDraft":
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
