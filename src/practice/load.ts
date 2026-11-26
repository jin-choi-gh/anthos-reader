import { practiceProblem } from "./guard"
import type { Practice } from "./types"

// The version of practice files this reader reads: 2 gave stages and steps ids, stages their days,
// and recalls the stage or step they name; 3 gave steps their restore
const FORMAT_VERSION = 3

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
 * format version 3, and, without those two marks, a practice. Throws, naming `origin` and saying
 * what is wrong, when it is not. */
export function parsePractice(data: unknown, origin: string): Practice {
  if (!isRecord(data) || data.format !== "anthos-practice") {
    throw new Error(`${origin}: not an anthos practice`)
  }
  if (data.format_version !== FORMAT_VERSION) {
    throw new Error(
      `${origin}: format version ${String(data.format_version)}, but this reader reads version ${FORMAT_VERSION}`,
    )
  }
  const { format: _format, format_version: _version, ...practice } = data
  const problem = practiceProblem(practice)
  if (problem !== null) throw new Error(`${origin}: ${problem}`)
  return practice as unknown as Practice
}

/** A practice as a practice file, as practice-data/ keeps one: marked "anthos-practice" and with
 * this reader's format version, then the practice, its fields in the order the guard names them;
 * written as Prettier writes JSON at this project's width, so that a file exported and put in
 * practice-data/ is already formatted: every object open, one field to a line, and every list on
 * one line where it fits in 100 columns, its comma included, and otherwise one item to a line.
 * parsePractice reads it back as the same practice. */
export function practiceFileOf(practice: Practice): string {
  const { id, title, text, stages } = practice
  const file = {
    format: "anthos-practice",
    format_version: FORMAT_VERSION,
    id,
    title,
    text,
    stages: stages.map(({ id, name, days, steps }) => ({
      id,
      name,
      days,
      steps: steps.map(({ id, prose, highlight, writing, recall, restore }) => ({
        id,
        prose,
        highlight: highlight.map(({ id, notehead, tags, body }) => ({ id, notehead, tags, body })),
        writing,
        recall,
        restore,
      })),
    })),
  }
  return `${written(file, "", 0, "")}\n`
}

// The width Prettier writes this project at (.prettierrc)
const WIDTH = 100

/** A JSON value as Prettier writes it, starting at a column, its lines indented by `indent`, with
 * what follows it on its line (`after`: a comma, or nothing): an object open, one field to a line;
 * a list on one line where it fits, and otherwise one item to a line; anything else as JSON writes
 * it. */
function written(value: unknown, indent: string, column: number, after: string): string {
  const inner = `${indent}  `
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]"
    const flat = flatList(value)
    if (flat !== null && column + flat.length + after.length <= WIDTH) return flat
    const items = value.map(
      (item, i) => inner + written(item, inner, inner.length, i < value.length - 1 ? "," : ""),
    )
    return `[\n${items.join(",\n")}\n${indent}]`
  }
  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value)
    if (entries.length === 0) return "{}"
    const fields = entries.map(([key, field], i) => {
      const head = `${inner}${JSON.stringify(key)}: `
      return head + written(field, inner, head.length, i < entries.length - 1 ? "," : "")
    })
    return `{\n${fields.join(",\n")}\n${indent}}`
  }
  return JSON.stringify(value)
}

/** A list on one line, as Prettier writes one that fits; null when an item is an object, which
 * Prettier keeps open. */
function flatList(list: readonly unknown[]): string | null {
  const items: string[] = []
  for (const item of list) {
    if (Array.isArray(item)) {
      const flat = flatList(item)
      if (flat === null) return null
      items.push(flat)
    } else if (typeof item === "object" && item !== null) {
      return null
    } else {
      items.push(JSON.stringify(item))
    }
  }
  return `[${items.join(", ")}]`
}

function fileName(path: string): string {
  return path.slice(path.lastIndexOf("/") + 1, -".json".length)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
