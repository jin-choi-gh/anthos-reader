// The closing step of each stage and the final stage of each practice are added by the runner.

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

export type Step = ConsiderStep

export interface ConsiderStep {
  verb: "consider"
  note: string
  prose: string[]
}

/** A local date, "2026-11-10"; days start at 04:00. */
export type Day = string

export type Event =
  | { kind: "visited"; stage: number; step: number; at: number }
  | { kind: "finished"; stage: number; at: number; day: Day }

export interface Position {
  stage: number // stages.length: the final stage
  step: number // steps.length: the closing step
  opensOn: Day | null
}
