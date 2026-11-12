import type { Note } from "../../material/types"

/** What the frame is fixed on, as the scene needs it: no positions, no references. */
export type Subject =
  | { kind: "consider"; text: string; note: Note | null; prose: string[] }
  | { kind: "rest"; text: string }
  | { kind: "final"; text: string }
  | { kind: "annotate"; text: string; notes: Note[] }

/** The subject of one kind. */
export type SubjectOf<K extends Subject["kind"]> = Extract<Subject, { kind: K }>

/** What the frame tells the scene: it only ever speaks, when it moves. */
export interface FrameProtocol {
  toScene: { kind: "subject"; subject: Subject }
}

export interface ViewerProtocol {
  toScene: { kind: "tapNote"; note: number } | { kind: "closeNote" }
  fromScene: never
}

export interface PraxisBarProtocol {
  toScene: never
  fromScene: never
}

export type ViewerProjection =
  | { kind: "marked"; text: string; marked: number[]; open: number | null }
  | { kind: "listed"; text: string; shown: number[]; open: number | null }

export type PraxisBarProjection = { kind: "prose"; paragraphs: string[] }

export interface Reply<State> {
  state: State
  toViewer: ViewerProtocol["fromScene"][]
  toPraxisBar: PraxisBarProtocol["fromScene"][]
}

/** How the scene behaves while its subject is of one kind. */
export interface Behaviour<S extends Subject, State> {
  start(subject: S): Reply<State>
  fromViewer(state: State, message: ViewerProtocol["toScene"]): Reply<State>
  fromPraxisBar(state: State, message: PraxisBarProtocol["toScene"]): Reply<State>
  viewer(state: State): ViewerProjection
  praxisBar(state: State): PraxisBarProjection | null
}
