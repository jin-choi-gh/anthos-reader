import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react"
import { scene, type SceneState } from "./scene"
import type {
  Effect,
  FrameProtocol,
  PraxisBarProjection,
  PraxisBarProtocol,
  Reply,
  Subject,
  ViewerProjection,
  ViewerProtocol,
} from "./types"

/** A message on its way to the scene, and who sent it. */
export type Envelope =
  | { from: "frame"; message: FrameProtocol["toScene"] }
  | { from: "viewer"; message: ViewerProtocol["toScene"] }
  | { from: "praxisBar"; message: PraxisBarProtocol["toScene"] }

/** The scene's reply to an envelope. Pure: the hook below delivers what it says. */
export function receive(current: SceneState, envelope: Envelope): Reply<SceneState> {
  switch (envelope.from) {
    case "frame":
      return scene.fromFrame(current, envelope.message)
    case "viewer":
      return scene.fromViewer(current, envelope.message)
    case "praxisBar":
      return scene.fromPraxisBar(current, envelope.message)
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

/** The scene, kept for as long as the mode that holds it: started on the frame's first subject, told
 * each new subject, and answering the viewer and the praxis bar. Its effects go to `onEffect`, after
 * its state is kept, and never from inside React's own updates, which may run twice. */
export function useScene(subject: Subject, onEffect: (effect: Effect) => void): SceneHandle {
  const [current, setCurrent] = useState(() => scene.start(subject).state)
  // The latest state, for an envelope that arrives before React has drawn the last one
  const latest = useRef(current)
  // The latest handler, so the functions handed out below never go stale
  const handler = useRef(onEffect)
  useLayoutEffect(() => {
    handler.current = onEffect
  })

  const deliver = useCallback((envelope: Envelope) => {
    const answer = receive(latest.current, envelope)
    latest.current = answer.state
    setCurrent(answer.state)
    for (const effect of answer.effects) handler.current(effect)
  }, [])

  // Before the screen is painted, so the frame and the scene are never drawn out of step. The first
  // subject is the one the scene started from, so the scene ignores it
  useLayoutEffect(() => {
    deliver({ from: "frame", message: { kind: "subject", subject } })
  }, [subject, deliver])

  // The same functions for the mode's whole life
  const toScene = useMemo(
    () => ({
      viewer: (message: ViewerProtocol["toScene"]) => deliver({ from: "viewer", message }),
      praxisBar: (message: PraxisBarProtocol["toScene"]) => deliver({ from: "praxisBar", message }),
    }),
    [deliver],
  )

  return { viewer: scene.viewer(current), praxisBar: scene.praxisBar(current), toScene }
}
