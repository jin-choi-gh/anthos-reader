// The rest at the end of each stage and the final stage of each practice are added by the runner.

export interface Practice {
  id: string
  title: string
  text: string // the text-data file: "dickinson"
  stages: Stage[]
}

export interface Stage {
  name: string
  steps: Step[]
}

export type Step = ConsiderStep | RespondStep

export interface ConsiderStep {
  direction: "consider"
  note: string
  prose: string[]
}

export interface RespondStep {
  direction: "respond"
  prose: string[]
}
