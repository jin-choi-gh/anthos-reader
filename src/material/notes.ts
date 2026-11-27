import { lineRangesOf, sameSpan, textOf, wholePoem } from "./spans"
import type { Annotation, LemmaPart, Note, NoteRange, Notes, Span, Substrate } from "./types"

/** The notes as they are shown, for any annotations, the editor's or the reader's: every annotation,
 * in the order given, with its index (its place in that order, from 0), its id, its lemma and its
 * paragraphs; and what each line's notes cover. Indexes last only as long as the set: never save
 * them. */
export function notesFor(substrate: Substrate, annotations: readonly Annotation[]): Notes {
  const notes: Note[] = annotations.map((annotation, index) => ({
    index,
    id: annotation.id,
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

/** One target's part of the lemma: for the whole poem, the citation "the whole poem"; for anything
 * else, whole lines as any other passage, a quote of its words, with " / " at line breaks and
 * " / … / " for the lines between a long passage's first and last. */
function targetLemma(substrate: Substrate, target: Span): LemmaPart {
  if (sameSpan(target, wholePoem(substrate))) return { kind: "citation", text: "the whole poem" }
  const lines = textOf(substrate, target).split("\n")
  const text =
    lines.length <= 2 ? lines.join(" / ") : `${lines[0]} / … / ${lines[lines.length - 1]}`
  return { kind: "quote", text }
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
      if (sameSpan(target, wholePoem(substrate))) continue
      for (const { line, start, end } of lineRangesOf(substrate, target)) {
        const onLine = ranges[line]
        if (onLine === undefined) {
          throw new RangeError(`a note's target runs past line ${line}`)
        }
        onLine.push({ start, end, noteIndex: index })
      }
    }
  }
  return ranges
}
