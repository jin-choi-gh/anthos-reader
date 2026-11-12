import { keepOpen, onViewer, viewerOf } from "./parts/commentary"
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
  PraxisBarProjection,
  PraxisBarProtocol,
  Reply,
  Subject,
  ViewerProjection,
  ViewerProtocol,
} from "./types"

// The scene: the staging of one frame on the screen. It is made of parts, and knows nothing of
// which direction they came from: the commentary answers the viewer, the notebook page answers the
// praxis bar, and the intertitle is only drawn.

export interface SceneState {
  readonly subject: Subject
  /** The editor's note the reader has opened, by its index. */
  readonly open: number | null
  /** The notebook page, when the subject asks for writing. */
  readonly writing: WritingState | null
}

export const scene = {
  /** A cut: the scene staged afresh on a subject. */
  start(subject: Subject): Reply<SceneState> {
    const writing = subject.writing === null ? null : startWriting(subject.writing)
    return reply({ subject, open: null, writing })
  },

  /** The frame's new subject. The very same subject changes nothing. A new key is a cut. The same
   * key is a hold: the parts keep their state, brought up to date with what changed around them. */
  fromFrame(current: SceneState, message: FrameProtocol["toScene"]): Reply<SceneState> {
    const { subject } = message
    if (subject === current.subject) return reply(current)
    if (subject.key !== current.subject.key) return scene.start(subject)
    const writing =
      subject.writing === null
        ? null
        : current.writing === null
          ? startWriting(subject.writing)
          : keepWriting(subject.writing, current.writing)
    return reply({ subject, open: keepOpen(subject.commentary, current.open), writing })
  },

  /** The viewer speaks to the commentary. */
  fromViewer(current: SceneState, message: ViewerProtocol["toScene"]): Reply<SceneState> {
    const open = onViewer(current.subject.commentary, current.open, message)
    return reply(open === current.open ? current : { ...current, open })
  },

  /** The praxis bar speaks to the notebook page, which may write in the notebook. */
  fromPraxisBar(current: SceneState, message: PraxisBarProtocol["toScene"]): Reply<SceneState> {
    const { writing } = current.subject
    if (writing === null || current.writing === null) return reply(current)
    const answer = onPraxisBar(writing, current.writing, message)
    const state = answer.state === current.writing ? current : { ...current, writing: answer.state }
    return reply(state, answer.effects)
  },

  viewer(current: SceneState): ViewerProjection {
    return viewerOf(current.subject.text, current.subject.commentary, current.open)
  },

  /** The intertitle and the notebook page; nothing at all when there is neither, as at the rest. */
  praxisBar(current: SceneState): PraxisBarProjection | null {
    const { prose, writing } = current.subject
    const page =
      writing === null || current.writing === null ? null : writingOf(writing, current.writing)
    if (prose.length === 0 && page === null) return null
    return { prose, writing: page }
  },
}
