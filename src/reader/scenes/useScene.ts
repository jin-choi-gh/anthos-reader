import { useLayoutEffect, useMemo, useReducer } from "react"
import { scene, type SceneState } from "./scene"
import type {
  FrameProtocol,
  PraxisBarProjection,
  PraxisBarProtocol,
  Subject,
  ViewerProjection,
  ViewerProtocol,
} from "./types"

/** A message on its way to the scene, and who sent it. */
export type Envelope =
  | { from: "frame"; message: FrameProtocol["toScene"] }
  | { from: "viewer"; message: ViewerProtocol["toScene"] }
  | { from: "praxisBar"; message: PraxisBarProtocol["toScene"] }

/** The scene as React's reducer: an envelope in, the scene's next state out. The replies' messages to
 * the viewer and the praxis bar are dropped, because there are none yet: when there are, they will
 * need a way to be delivered. */
export function sceneReducer(current: SceneState, envelope: Envelope): SceneState {
  switch (envelope.from) {
    case "frame":
      return scene.fromFrame(current, envelope.message).state
    case "viewer":
      return scene.fromViewer(current, envelope.message).state
    case "praxisBar":
      return scene.fromPraxisBar(current, envelope.message).state
  }
}

/** What a mode hands its viewer and its praxis bar: what to draw, and how to talk to the scene. */
export interface SceneHandle {
  viewer: ViewerProjection
  praxisBar: PraxisBarProjection | null
  toScene: {
    viewer(message: ViewerProtocol["toScene"]): void
    praxisBar(message: PraxisBarProtocol["toScene"]): void
  }
}

/** The scene, kept for as long as the mode that holds it: started on the frame's first subject, and
 * told each new subject when the frame moves. */
export function useScene(subject: Subject): SceneHandle {
  const [current, send] = useReducer(sceneReducer, subject, (first) => scene.start(first).state)

  // Before the screen is painted, so the frame and the scene are never drawn out of step. The first
  // subject is the one the scene started from, so the scene ignores it
  useLayoutEffect(() => {
    send({ from: "frame", message: { kind: "subject", subject } })
  }, [subject])

  // The same functions for the mode's whole life
  const toScene = useMemo(
    () => ({
      viewer: (message: ViewerProtocol["toScene"]) => send({ from: "viewer", message }),
      praxisBar: (message: PraxisBarProtocol["toScene"]) => send({ from: "praxisBar", message }),
    }),
    [],
  )

  return { viewer: scene.viewer(current), praxisBar: scene.praxisBar(current), toScene }
}
