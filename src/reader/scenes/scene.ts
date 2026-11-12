import { annotate, type AnnotateState } from "./annotate"
import { final } from "./final"
import { reply } from "./reply"
import { rest } from "./rest"
import type {
  Behaviour,
  FrameProtocol,
  PraxisBarProjection,
  PraxisBarProtocol,
  Reply,
  Subject,
  SubjectOf,
  ViewerProjection,
  ViewerProtocol,
} from "./types"
import { consider, type ConsiderState } from "./directions/consider"

export type SceneState =
  | { kind: "consider"; subject: SubjectOf<"consider">; state: ConsiderState }
  | { kind: "rest"; subject: SubjectOf<"rest">; state: SubjectOf<"rest"> }
  | { kind: "final"; subject: SubjectOf<"final">; state: SubjectOf<"final"> }
  | { kind: "annotate"; subject: SubjectOf<"annotate">; state: AnnotateState }

export interface Scene extends Behaviour<Subject, SceneState> {
  fromFrame(current: SceneState, message: FrameProtocol["toScene"]): Reply<SceneState>
}

export const scene: Scene = {
  start,
  fromFrame: (current, message) => {
    switch (message.kind) {
      case "subject":
        // The very subject it is on already: the frame has not moved, so nothing restarts
        return message.subject === current.subject ? reply(current) : start(message.subject)
    }
  },
  fromViewer: (current, message) => bound(current).fromViewer(message),
  fromPraxisBar: (current, message) => bound(current).fromPraxisBar(message),
  viewer: (current) => bound(current).viewer(),
  praxisBar: (current) => bound(current).praxisBar(),
}

function start(subject: Subject): Reply<SceneState> {
  switch (subject.kind) {
    case "consider":
      return lift(consider.start(subject), (state) => ({ kind: "consider", subject, state }))
    case "rest":
      return lift(rest.start(subject), (state) => ({ kind: "rest", subject, state }))
    case "final":
      return lift(final.start(subject), (state) => ({ kind: "final", subject, state }))
    case "annotate":
      return lift(annotate.start(subject), (state) => ({ kind: "annotate", subject, state }))
  }
}

/** The scene's behaviour, with its state already in hand. */
interface Bound {
  fromViewer(message: ViewerProtocol["toScene"]): Reply<SceneState>
  fromPraxisBar(message: PraxisBarProtocol["toScene"]): Reply<SceneState>
  viewer(): ViewerProjection
  praxisBar(): PraxisBarProjection | null
}

function bound(current: SceneState): Bound {
  switch (current.kind) {
    case "consider":
      return bind(consider, current, current.state, (state) => ({ ...current, state }))
    case "rest":
      return bind(rest, current, current.state, (state) => ({ ...current, state }))
    case "final":
      return bind(final, current, current.state, (state) => ({ ...current, state }))
    case "annotate":
      return bind(annotate, current, current.state, (state) => ({ ...current, state }))
  }
}

/** Binds a behaviour to its state. A reply that keeps the behaviour's state keeps the scene's. */
function bind<S extends Subject, State>(
  behaviour: Behaviour<S, State>,
  current: SceneState,
  state: State,
  wrap: (state: State) => SceneState,
): Bound {
  const keep = (next: State) => (next === state ? current : wrap(next))
  return {
    fromViewer: (message) => lift(behaviour.fromViewer(state, message), keep),
    fromPraxisBar: (message) => lift(behaviour.fromPraxisBar(state, message), keep),
    viewer: () => behaviour.viewer(state),
    praxisBar: () => behaviour.praxisBar(state),
  }
}

/** A behaviour's reply as the scene's: the same messages, the state wrapped. */
function lift<State>(answer: Reply<State>, wrap: (state: State) => SceneState): Reply<SceneState> {
  return { ...answer, state: wrap(answer.state) }
}
