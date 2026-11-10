import type { Practice } from "../types"
import { firstReading } from "./firstReading"

/** Every practice this reader knows: at most one per text, for now. */
export const PRACTICES: readonly Practice[] = [firstReading]

/** The practice performed on a text, or null: the text then opens as it does today. */
export function practiceFor(file: string): Practice | null {
  return PRACTICES.find((practice) => practice.text === file) ?? null
}
