import { assertNever } from "../assertNever"
import type { Material } from "../material/materials"
import { spansOfNotehead } from "../material/noteheads"
import { comparePositions, lineLength, sameSpan } from "../material/spans"
import type { Span, Substrate } from "../material/types"
import { stageIndexOf, stepPlaceOf } from "./places"
import type { Practice, Recall, Restore } from "./types"

/** One thing that keeps a practice from running: its place (the stage, the step in it and the note
 * in that, each from 0, null where the problem is not in one), what it is about, and what is wrong,
 * in words that do not repeat the place. */
export interface Problem {
  readonly stage: number | null
  readonly step: number | null
  readonly note: number | null
  readonly about: ProblemAbout
  readonly text: string
}

/** What a problem is about: something not yet written (the practice's stages or title, a stage's
 * name or steps, a step's prose, a note's body, a restore's gaps), or something written wrong (an
 * id, a stage's days, a step's parts, a note's notehead, a recall, a restore's gap). */
export type ProblemAbout =
  | "stages"
  | "title"
  | "name"
  | "steps"
  | "prose"
  | "body"
  | "id"
  | "days"
  | "parts"
  | "notehead"
  | "recall"
  | "gaps"
  | "gap"

// An id, as loom allows one: letters, digits, - and _
const ID = /^[A-Za-z0-9_-]+$/

/** Everything that keeps a practice from running on its text, whose lines and words are given, in the
 * practice's order: no title; no stages; a stage with no name or no steps; an id that is malformed,
 * or that a stage, step or note before it, of the same kind, has already; days on the first stage,
 * or days on a later one that are not a whole number of at least 1; a step with no prose, or with
 * more than one of highlight, writing and recall, since a step asks one thing of the reader and a
 * subject has one commentary; a note with no body, or a notehead that cannot be placed on the lines;
 * and a recall of the whole practice, which only the final stage makes, or one naming a stage or step
 * that is not there, that does not come before it, or that asks for nothing to be written; and a restore with fewer than two gaps, a gap that cannot be placed
 * or that is not what the restore takes out, or gaps that overlap. None means the practice can run. */
export function problemsOf(
  practice: Practice,
  text: Pick<Material, "substrate" | "words">,
): Problem[] {
  const { substrate } = text
  const problems: Problem[] = []
  const add = (
    place: { stage?: number; step?: number; note?: number },
    about: ProblemAbout,
    text: string,
  ) => {
    const { stage = null, step = null, note = null } = place
    problems.push({ stage, step, note, about, text })
  }
  // The first place each id is found at, by kind, in words
  const stageIds = new Map<string, string>()
  const stepIds = new Map<string, string>()
  const noteIds = new Map<string, string>()
  const idOf = (
    place: { stage?: number; step?: number; note?: number },
    id: string,
    taken: Map<string, string>,
  ) => {
    const here = placeWords(practice, place)
    if (!ID.test(id)) {
      add(place, "id", `the id ${JSON.stringify(id)} is not an id: use letters, digits, - and _`)
    } else if (taken.has(id)) {
      add(place, "id", `the id ${id} is already the id of ${taken.get(id)}`)
    } else {
      taken.set(id, here)
    }
  }

  if (practice.title.trim() === "") add({}, "title", "no title")
  if (practice.stages.length === 0) add({}, "stages", "no stages")
  practice.stages.forEach((stage, s) => {
    idOf({ stage: s }, stage.id, stageIds)
    if (stage.name.trim() === "") add({ stage: s }, "name", "no name")
    if (s === 0) {
      if (stage.days !== null) {
        add({ stage: s }, "days", "days on the first stage, which is open from the start")
      }
    } else if (stage.days === null || !Number.isInteger(stage.days) || stage.days < 1) {
      add({ stage: s }, "days", "its days must be a whole number of at least 1")
    }
    if (stage.steps.length === 0) add({ stage: s }, "steps", "no steps")

    stage.steps.forEach((step, i) => {
      const at = { stage: s, step: i }
      idOf(at, step.id, stepIds)
      if (!step.prose.some((paragraph) => paragraph.trim() !== "")) add(at, "prose", "no prose")
      const parts = [
        step.highlight.length > 0,
        step.writing !== null,
        step.recall !== null,
        step.restore !== null,
      ]
      if (parts.filter(Boolean).length > 1) {
        add(
          at,
          "parts",
          "more than one of highlight, writing, recall and restore: a step asks one thing",
        )
      }
      step.highlight.forEach((note, n) => {
        const on = { ...at, note: n }
        idOf(on, note.id, noteIds)
        if (note.body.trim() === "") add(on, "body", "no body")
        const placed = spansOfNotehead(substrate, note.notehead)
        if ("problem" in placed) add(on, "notehead", placed.problem)
      })
      if (step.recall !== null) {
        const wrong = recallProblem(practice, step.recall, at)
        if (wrong !== null) add(at, "recall", wrong)
      }
      if (step.restore !== null) {
        for (const { about, text: wrong } of restoreProblems(step.restore, text)) {
          add(at, about, wrong)
        }
      }
    })
  })
  return problems
}

/** What keeps a restore from being played: fewer than two gaps (not yet written); and, written
 * wrong, a gap whose notehead cannot be placed, or places more than one passage, or is not what
 * the restore takes out (exactly one of the poem's words, or one whole line with text), and two gaps
 * that overlap, as the same word named twice does. A gap is judged by where it is placed, however
 * its notehead is written: "l5" and "l5 Hope" are the same word on a line that is only "Hope". */
function restoreProblems(
  restore: Restore,
  text: Pick<Material, "substrate" | "words">,
): { about: "gaps" | "gap"; text: string }[] {
  const problems: { about: "gaps" | "gap"; text: string }[] = []
  if (restore.gaps.length < 2) {
    problems.push({ about: "gaps", text: "fewer than two gaps: a restore needs two at least" })
  }
  const placed: { gap: string; span: Span }[] = []
  for (const gap of restore.gaps) {
    const named = `gap ${JSON.stringify(gap)}`
    const spans = spansOfNotehead(text.substrate, gap)
    if ("problem" in spans) {
      problems.push({ about: "gap", text: `${named}: ${spans.problem}` })
      continue
    }
    const [span, ...more] = spans.spans
    if (span === undefined || more.length > 0) {
      problems.push({ about: "gap", text: `${named} is more than one passage` })
      continue
    }
    const fits = restore.of === "words" ? isWord(text.words, span) : isLine(text.substrate, span)
    if (!fits) {
      const what = restore.of === "words" ? "one of the poem's words" : "one whole line"
      problems.push({ about: "gap", text: `${named} is not ${what}` })
      continue
    }
    const overlapped = placed.find((other) => overlap(other.span, span))
    if (overlapped !== undefined) {
      const other = JSON.stringify(overlapped.gap)
      problems.push({ about: "gap", text: `${named} overlaps the gap ${other}` })
      continue
    }
    placed.push({ gap, span })
  }
  return problems
}

/** Whether a span is exactly one of the poem's words. */
function isWord(words: readonly Span[], span: Span): boolean {
  return words.some((word) => sameSpan(word, span))
}

/** Whether a span is exactly one whole line, with text. */
function isLine(substrate: Substrate, span: Span): boolean {
  const { start, end } = span
  return (
    start.line === end.line &&
    start.offset === 0 &&
    end.offset === lineLength(substrate, end.line) &&
    end.offset > 0
  )
}

/** Whether two spans share any of the poem: each starts before the other ends. */
function overlap(a: Span, b: Span): boolean {
  return comparePositions(a.start, b.end) < 0 && comparePositions(b.start, a.end) < 0
}

/** A problem in words, with its place first: `stage 2 "Nature", step 3: no prose`. */
export function wordedProblem(practice: Practice, problem: Problem): string {
  const { stage, step, note } = problem
  if (stage === null) return problem.text
  return `${placeWords(practice, { stage, step: step ?? undefined, note: note ?? undefined })}: ${problem.text}`
}

/** What keeps a step's recall from bringing anything back, or null: a recall of the whole
 * practice; or one naming a stage or step that is not there, that does not come before the step (a
 * stage must be an earlier stage; a step may be earlier in the same stage), or that asks for nothing
 * to be written. */
function recallProblem(
  practice: Practice,
  recall: Recall,
  at: { stage: number; step: number },
): string | null {
  switch (recall.from) {
    case "all":
      return "a recall of the whole practice, which only the final stage makes"
    case "stage": {
      const s = stageIndexOf(practice, recall.id)
      if (s === null) return `recalls the stage ${recall.id}, which is not there`
      const named = `recalls stage ${s + 1}`
      if (s >= at.stage) return `${named}, which does not come before it`
      const stage = practice.stages[s]
      if (stage === undefined || stage.steps.every((step) => step.writing === null)) {
        return `${named}, which asks for nothing to be written`
      }
      return null
    }
    case "step": {
      const place = stepPlaceOf(practice, recall.id)
      if (place === null) return `recalls the step ${recall.id}, which is not there`
      const named = `recalls stage ${place.stage + 1}, step ${place.step + 1}`
      if (place.stage > at.stage || (place.stage === at.stage && place.step >= at.step)) {
        return `${named}, which does not come before it`
      }
      const step = practice.stages[place.stage]?.steps[place.step]
      if (step === undefined || step.writing === null) {
        return `${named}, which asks for nothing to be written`
      }
      return null
    }
    default:
      return assertNever(recall)
  }
}

/** A place in a practice, in words: `stage 2 "Nature", step 3, note 1`. */
function placeWords(
  practice: Practice,
  place: { stage?: number | undefined; step?: number | undefined; note?: number | undefined },
): string {
  if (place.stage === undefined) return "the practice"
  const name = practice.stages[place.stage]?.name.trim() ?? ""
  let words = `stage ${place.stage + 1}${name === "" ? "" : ` "${name}"`}`
  if (place.step !== undefined) words += `, step ${place.step + 1}`
  if (place.note !== undefined) words += `, note ${place.note + 1}`
  return words
}
