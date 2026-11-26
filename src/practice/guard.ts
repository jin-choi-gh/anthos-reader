import type { Practice } from "./types"

/** Whether a value read from a file or from storage is a practice: isPractice is practiceProblem
 * finding nothing. */
export function isPractice(value: unknown): value is Practice {
  return practiceProblem(value) === null
}

/** What keeps a value read from a file or from storage from being a practice, saying where, or
 * null if nothing does. Every field must be there, null where it is empty ("writing": null), and no
 * other: a field this reader does not know would be hashed into the practice's fingerprint
 * unseen, so it is refused. */
export function practiceProblem(value: unknown): string | null {
  return fieldsProblem(value, "the practice", ["id", "title", "text", "stages"], (practice) =>
    first(
      stringProblem(practice.id, "the practice's id"),
      stringProblem(practice.title, "the practice's title"),
      stringProblem(practice.text, "the practice's text"),
      listProblem(practice.stages, "the practice's stages", (stage, s) =>
        stageProblem(stage, `stage ${s + 1}`),
      ),
    ),
  )
}

function stageProblem(value: unknown, at: string): string | null {
  return fieldsProblem(value, at, ["id", "name", "days", "steps"], (stage) =>
    first(
      stringProblem(stage.id, `${at}: its id`),
      stringProblem(stage.name, `${at}: its name`),
      stage.days === null || (typeof stage.days === "number" && Number.isFinite(stage.days))
        ? null
        : `${at}: its days must be a number, or null`,
      listProblem(stage.steps, `${at}: its steps`, (step, i) =>
        stepProblem(step, `${at}, step ${i + 1}`),
      ),
    ),
  )
}

function stepProblem(value: unknown, at: string): string | null {
  const fields = ["id", "prose", "highlight", "writing", "recall", "restore"]
  return fieldsProblem(value, at, fields, (step) =>
    first(
      stringProblem(step.id, `${at}: its id`),
      listProblem(step.prose, `${at}: prose`, (paragraph, p) =>
        stringProblem(paragraph, `${at}: prose paragraph ${p + 1}`),
      ),
      listProblem(step.highlight, `${at}: highlight`, (note, n) =>
        noteProblem(note, `${at}, note ${n + 1}`),
      ),
      step.writing === null ? null : writingProblem(step.writing, `${at}: writing`),
      step.recall === null ? null : recallProblem(step.recall, `${at}: recall`),
      step.restore === null ? null : restoreProblem(step.restore, `${at}: restore`),
    ),
  )
}

function noteProblem(value: unknown, at: string): string | null {
  return fieldsProblem(value, at, ["id", "notehead", "tags", "body"], (note) =>
    first(
      stringProblem(note.id, `${at}: its id`),
      stringProblem(note.notehead, `${at}: its notehead`),
      tagsProblem(note.tags, `${at}: its tags`),
      stringProblem(note.body, `${at}: its body`),
    ),
  )
}

function writingProblem(value: unknown, at: string): string | null {
  return fieldsProblem(value, at, ["target", "tags", "count"], (writing) =>
    first(
      oneOfProblem(writing.target, `${at}.target`, ["whole", "chosen"]),
      tagsProblem(writing.tags, `${at}.tags`),
      oneOfProblem(writing.count, `${at}.count`, ["one"]),
    ),
  )
}

/** A restore takes out words or lines, and names its gaps by their noteheads. Whether they can be
 * placed, and are words or lines, is for problemsOf to say. */
function restoreProblem(value: unknown, at: string): string | null {
  return fieldsProblem(value, at, ["of", "gaps"], (restore) =>
    first(
      oneOfProblem(restore.of, `${at}.of`, ["words", "lines"]),
      listProblem(restore.gaps, `${at}.gaps`, (gap, g) =>
        stringProblem(gap, `${at}, gap ${g + 1}`),
      ),
    ),
  )
}

/** A recall names what it brings back: a stage or a step, by its id; or the whole practice, with no
 * id. Whether what it names is there is for problemsOf to say. */
function recallProblem(value: unknown, at: string): string | null {
  if (!isRecord(value)) return `${at} must be an object`
  const from = oneOfProblem(value.from, `${at}.from`, ["stage", "step", "all"])
  if (from !== null) return from
  if (value.from === "all") return fieldsProblem(value, at, ["from"], () => null)
  return fieldsProblem(value, at, ["from", "id"], (recall) => stringProblem(recall.id, `${at}.id`))
}

/** A record with exactly these fields, then whatever the record's own check finds. */
function fieldsProblem(
  value: unknown,
  at: string,
  fields: readonly string[],
  check: (record: Record<string, unknown>) => string | null,
): string | null {
  if (!isRecord(value)) return `${at} must be an object`
  const missing = fields.filter((field) => !(field in value))
  if (missing.length > 0) return `${at} has no ${missing.join(", ")}`
  const unknown = Object.keys(value).filter((key) => !fields.includes(key))
  if (unknown.length > 0) return `${at} has fields this reader does not know: ${unknown.join(", ")}`
  return check(value)
}

function listProblem(
  value: unknown,
  at: string,
  check: (item: unknown, index: number) => string | null,
): string | null {
  if (!Array.isArray(value)) return `${at} must be a list`
  return first(...value.map((item: unknown, index) => check(item, index)))
}

function tagsProblem(value: unknown, at: string): string | null {
  return listProblem(value, at, (tag, t) => stringProblem(tag, `${at}, tag ${t + 1}`))
}

function stringProblem(value: unknown, at: string): string | null {
  return typeof value === "string" ? null : `${at} must be text`
}

function oneOfProblem(value: unknown, at: string, allowed: readonly string[]): string | null {
  return typeof value === "string" && allowed.includes(value)
    ? null
    : `${at} must be ${allowed.map((option) => JSON.stringify(option)).join(" or ")}`
}

function first(...problems: (string | null)[]): string | null {
  return problems.find((problem) => problem !== null) ?? null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
