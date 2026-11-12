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

export type Step = ConsiderStep

export interface ConsiderStep {
  direction: "consider"
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
  step: number // steps.length: the rest
  opensOn: Day | null
}

export type Reason =
  { kind: "noSuchStep" } | { kind: "waiting"; opensOn: Day | null } | { kind: "finished" }

export type Ruling = { allowed: true; to: number } | { allowed: false; reason: Reason }
