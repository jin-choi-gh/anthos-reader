import type { Position, Ruling } from "../../practice/types"

export interface Frame {
  position: Position
  heading: string | null
  back: Ruling | null
  next: Ruling | null
}

export interface ViewerProtocol {
  toScene: { kind: "tapNote"; note: number }
  fromScene: never
}

export interface PraxisBarProtocol {
  toScene: never
  fromScene: never
}

export type ViewerProjection = { kind: "text"; shown: number[]; open: number | null }

export type PraxisBarProjection = { kind: "prose"; paragraphs: string[] }

export interface Reply<State> {
  state: State
  toViewer: ViewerProtocol["fromScene"][]
  toPraxisBar: PraxisBarProtocol["fromScene"][]
}

export interface Scene<State> {
  start(): Reply<State>
  fromViewer(state: State, message: ViewerProtocol["toScene"]): Reply<State>
  fromPraxisBar(state: State, message: PraxisBarProtocol["toScene"]): Reply<State>
  viewer(state: State): ViewerProjection
  praxisBar(state: State): PraxisBarProjection | null
}
