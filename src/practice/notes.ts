import type { Note } from "../reader/types"
import type { Practice } from "./types"

const REFERENCE = /^@([A-Za-z0-9_-]+)$/

export function idOf(ref: string): string | null {
  return REFERENCE.exec(ref)?.[1] ?? null
}

export function noteFor(ref: string, notes: Note[]): Note | null {
  const id = idOf(ref)
  return id === null ? null : (notes.find((note) => note.loomId === id) ?? null)
}

export function problemsOf(practice: Practice, notes: Note[]): string[] {
  const problems: string[] = []
  if (practice.stages.length === 0) problems.push("no stages")
  practice.stages.forEach((stage, s) => {
    const where = `stage ${s + 1} "${stage.name}"`
    if (stage.steps.length === 0) problems.push(`${where}: no steps`)
    stage.steps.forEach((step, i) => {
      const at = `${where}, step ${i + 1}`
      if (idOf(step.note) === null) {
        problems.push(
          step.note.includes("/")
            ? `${at}: ${step.note} refers to another text, which is not read yet`
            : `${at}: ${step.note} is not a note reference; write @ and the note's id`,
        )
      } else if (noteFor(step.note, notes) === null) {
        problems.push(`${at}: no note ${step.note} in ${practice.text}`)
      }
    })
  })
  return problems
}
