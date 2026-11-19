import { practiceProblem } from "./guard"
import type { Practice } from "./types"

// Every practice file in anthos-reader/practice-data/, read by Vite when it builds the app: file path
// → the file's JSON. Practices are small, so all are read at once.
const files = import.meta.glob<unknown>("../../practice-data/*.json", {
  import: "default",
  eager: true,
})

/** Every practice file in practice-data/, in the order of their file names: the practices this
 * reader understands, and, for each file it does not, why not. One file it cannot read keeps no
 * other from being read. */
export function loadPractices(): { practices: Practice[]; problems: string[] } {
  const practices: Practice[] = []
  const problems: string[] = []
  for (const path of Object.keys(files).sort()) {
    try {
      practices.push(parsePractice(files[path], `practice-data/${fileName(path)}.json`))
    } catch (error) {
      problems.push(error instanceof Error ? error.message : String(error))
    }
  }
  return { practices, problems }
}

/** Parsed JSON checked to be a practice file this reader understands: marked "anthos-practice",
 * format version 1, and, without those two marks, a practice. Throws, naming `origin` and saying
 * what is wrong, when it is not. */
export function parsePractice(data: unknown, origin: string): Practice {
  if (!isRecord(data) || data.format !== "anthos-practice") {
    throw new Error(`${origin}: not an anthos practice`)
  }
  if (data.format_version !== 1) {
    throw new Error(
      `${origin}: format version ${String(data.format_version)}, but this reader reads version 1`,
    )
  }
  const { format: _format, format_version: _version, ...practice } = data
  const problem = practiceProblem(practice)
  if (problem !== null) throw new Error(`${origin}: ${problem}`)
  return practice as unknown as Practice
}

function fileName(path: string): string {
  return path.slice(path.lastIndexOf("/") + 1, -".json".length)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
