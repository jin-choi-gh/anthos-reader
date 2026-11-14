import { lineLength, sameSpan, textOf, wholePoem } from "./spans"
import type { Annotation, LemmaPart, Note, NoteRange, Notes, Span, Substrate } from "./types"

/** What a target covers: the whole poem, whole lines, or a passage starting or ending inside a line. */
type TargetKind = "poem" | "lines" | "passage"

/** The editor's notes, as they are shown, from their annotations: every annotation, in the order
 * given, with its index (its place in that order, from 0), its id, its lemma and its paragraphs; and
 * what each line's notes cover. Indexes last only as long as the loaded file: never save them. */
export function editorsNotes(substrate: Substrate, annotations: readonly Annotation[]): Notes {
  const notes: Note[] = annotations.map((annotation, index) => ({
    index,
    loomId: annotation.id,
    lemma: lemmaOf(substrate, annotation.targets),
    tags: [...annotation.tags],
    paragraphs: paragraphsOf(annotation.body),
  }))
  const ranges = rangesByLine(substrate, annotations)
  return {
    notes,
    rangesOn: (indexInSubstrate) => ranges[indexInSubstrate] ?? [],
  }
}

/** What a note is about: one part for each of its targets, in the order given. */
export function lemmaOf(substrate: Substrate, targets: readonly Span[]): LemmaPart[] {
  return targets.map((target) => targetLemma(substrate, target))
}

/** One target's part of the lemma: a citation ("the whole poem", or its line numbers for whole
 * lines), or a quote of its words, with " / " at line breaks and " / … / " for the lines between a
 * long passage's first and last. */
function targetLemma(substrate: Substrate, target: Span): LemmaPart {
  const first = target.start.line + 1
  const last = target.end.line + 1
  switch (kindOf(substrate, target)) {
    case "poem":
      return { kind: "citation", text: "the whole poem" }
    case "lines":
      return {
        kind: "citation",
        text: first === last ? `line ${first}` : `lines ${first}–${last}`,
      }
    case "passage": {
      const lines = textOf(substrate, target).split("\n")
      const text =
        lines.length <= 2 ? lines.join(" / ") : `${lines[0]} / … / ${lines[lines.length - 1]}`
      return { kind: "quote", text }
    }
  }
}

/** A target's kind. By loom's rule a span never starts at a line's end nor ends at a line's start,
 * so a target starting at offset 0 and ending at its last line's length covers whole lines. */
function kindOf(substrate: Substrate, target: Span): TargetKind {
  if (sameSpan(target, wholePoem(substrate))) return "poem"
  const wholeLines =
    target.start.offset === 0 && target.end.offset === lineLength(substrate, target.end.line)
  return wholeLines ? "lines" : "passage"
}

/** A note's body as its paragraphs: split at blank lines, each paragraph's wrapped lines joined
 * into one, as the notes grammar reads them. */
function paragraphsOf(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter((paragraph) => paragraph !== "")
}

/** What notes cover, line by line: each target cut at the line breaks it crosses, in note order.
 * Whole-poem targets are left out, so that selecting such a note marks nothing. */
function rangesByLine(substrate: Substrate, annotations: readonly Annotation[]): NoteRange[][] {
  const ranges: NoteRange[][] = substrate.lines.map(() => [])
  for (const [index, annotation] of annotations.entries()) {
    for (const target of annotation.targets) {
      if (kindOf(substrate, target) === "poem") continue
      const { start, end } = target
      for (let line = start.line; line <= end.line; line++) {
        const onLine = ranges[line]
        if (onLine === undefined) {
          throw new RangeError(`a note's target runs past line ${line}`)
        }
        onLine.push({
          start: line === start.line ? start.offset : 0,
          end: line === end.line ? end.offset : lineLength(substrate, line),
          noteIndex: index,
        })
      }
    }
  }
  return ranges
}
