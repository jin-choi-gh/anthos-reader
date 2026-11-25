import { assertNever } from "../assertNever"
import { stageIndexOf, stepPlaceOf, type StepPlace } from "../practice/places"
import type { Problem, ProblemAbout } from "../practice/problems"
import type { Parts, Practice, Recall } from "../practice/types"

/** A part a step may ask besides its prose. */
export type PartName = "highlight" | "writing" | "recall"

/** The part a step asks besides its prose: the first it has of highlight, writing and recall, or
 * null for none. A step with more than one, which problemsOf refuses, is taken by its first. */
export function partOf(step: Parts): PartName | null {
  if (step.highlight.length > 0) return "highlight"
  if (step.writing !== null) return "writing"
  if (step.recall !== null) return "recall"
  return null
}

/** The start of a step's prose, to know it by: its first paragraph's first line, cut at a word
 * and marked … when it is longer than `length`; empty when it has none. */
export function excerptOf(prose: readonly string[], length = 48): string {
  const line = (prose.find((paragraph) => paragraph.trim() !== "") ?? "").trim().split("\n")[0]!
  if (line.length <= length) return line
  const cut = line.slice(0, length + 1)
  const space = cut.lastIndexOf(" ")
  return `${(space > length / 2 ? cut.slice(0, space) : line.slice(0, length)).trimEnd()}…`
}

/** A stage, in words: "Stage 2 · Nature and the Human Being", or "Stage 2" with no name. */
export function stageLabel(practice: Practice, stage: number): string {
  const name = practice.stages[stage]?.name.trim() ?? ""
  return name === "" ? `Stage ${stage + 1}` : `Stage ${stage + 1} · ${name}`
}

/** A step, in words: "Stage 1, step 10 · For one critic…", or without the excerpt when it has no
 * prose. */
export function stepLabel(practice: Practice, place: StepPlace): string {
  const step = practice.stages[place.stage]?.steps[place.step]
  const where = `Stage ${place.stage + 1}, step ${place.step + 1}`
  const excerpt = step === undefined ? "" : excerptOf(step.prose, 36)
  return excerpt === "" ? where : `${where} · ${excerpt}`
}

/** What a recall names, in words, whether or not it can bring anything back: the stage or step as
 * stageLabel and stepLabel write them, its id with "removed" when it is not there, or the whole
 * practice. */
export function recallLabel(practice: Practice, recall: Recall): string {
  switch (recall.from) {
    case "stage": {
      const stage = stageIndexOf(practice, recall.id)
      return stage === null ? `${recall.id}, removed` : stageLabel(practice, stage)
    }
    case "step": {
      const place = stepPlaceOf(practice, recall.id)
      return place === null ? `${recall.id}, removed` : stepLabel(practice, place)
    }
    case "all":
      return "The whole practice"
    default:
      return assertNever(recall)
  }
}

/** What a recall of the step at a place may name, in the practice's order, with each in words:
 * every earlier stage with a step that asks for writing, followed by its steps that ask for it;
 * and the steps of its own stage before it that ask for it. These are the recalls problemsOf takes
 * there. */
export function recallTargets(
  practice: Practice,
  at: StepPlace,
): { readonly recall: Recall; readonly label: string }[] {
  const targets: { recall: Recall; label: string }[] = []
  practice.stages.slice(0, at.stage + 1).forEach((stage, s) => {
    const before = s < at.stage ? stage.steps : stage.steps.slice(0, at.step)
    const asking = before.flatMap((step, i) => (step.writing === null ? [] : [{ step, i }]))
    if (s < at.stage && asking.length > 0) {
      targets.push({ recall: { from: "stage", id: stage.id }, label: stageLabel(practice, s) })
    }
    for (const { step, i } of asking) {
      targets.push({
        recall: { from: "step", id: step.id },
        label: stepLabel(practice, { stage: s, step: i }),
      })
    }
  })
  return targets
}

/** The part of a step, in a few words, for the reel's anatomy: "Highlighting · 2 notes", "Reader
 * response · whole poem", "Reader recall · Stage 1"; null for a step that asks nothing more. */
export function partLabel(practice: Practice, step: Parts): string | null {
  const part = partOf(step)
  switch (part) {
    case "highlight": {
      const n = step.highlight.length
      return `Highlighting · ${n} ${n === 1 ? "note" : "notes"}`
    }
    case "writing":
      return `Reader response · ${step.writing?.target === "chosen" ? "chosen passages" : "whole poem"}`
    case "recall":
      return step.recall === null ? null : `Reader recall · ${recallShort(practice, step.recall)}`
    case null:
      return null
    default:
      return assertNever(part)
  }
}

/** What a recall names, in the fewest words: "Stage 1", "Stage 1, step 10". */
function recallShort(practice: Practice, recall: Recall): string {
  switch (recall.from) {
    case "stage": {
      const stage = stageIndexOf(practice, recall.id)
      return stage === null ? `${recall.id}, removed` : `Stage ${stage + 1}`
    }
    case "step": {
      const place = stepPlaceOf(practice, recall.id)
      return place === null
        ? `${recall.id}, removed`
        : `Stage ${place.stage + 1}, step ${place.step + 1}`
    }
    case "all":
      return "the whole practice"
    default:
      return assertNever(recall)
  }
}

// What is written wrong, as opposed to what is not yet written
const BROKEN: ReadonlySet<ProblemAbout> = new Set(["id", "days", "parts", "notehead", "recall"])

/** Whether a problem is something written wrong (an id, days, a step's parts, a notehead, a
 * recall), to be shown as broken, rather than something not yet written (a title, a name, steps,
 * prose, a body), which a new practice starts with. */
export function isBroken(problem: Problem): boolean {
  return BROKEN.has(problem.about)
}

/** A stage's number as a numeral: 1 → "I", 4 → "IV", 14 → "XIV". */
export function romanOf(n: number): string {
  const numerals: readonly [number, string][] = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ]
  let rest = Math.floor(n)
  let roman = ""
  for (const [value, numeral] of numerals) {
    while (rest >= value) {
      roman += numeral
      rest -= value
    }
  }
  return roman
}

/** When a later stage opens, in words: "a day after stage I", "3 days after stage II"; null for the
 * first stage, which is open from the start, and for days that are not a whole number of at least
 * 1, which problemsOf refuses. */
export function opensAfter(practice: Practice, stage: number): string | null {
  const days = practice.stages[stage]?.days
  if (stage === 0 || days === undefined || days === null || !Number.isInteger(days) || days < 1) {
    return null
  }
  return `${days === 1 ? "a day" : `${days} days`} after stage ${romanOf(stage)}`
}
