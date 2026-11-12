import type { Notes, Poem } from "./types"

export interface Material {
  poem: Poem
  notes: Notes
}

export type Materials = (text: string) => Material | null
