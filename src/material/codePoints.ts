/** A text's characters as the material counts them: code points, not UTF-16 units. Every offset in
 * the material, as loom gives it, indexes this array directly: it is the unit positions are told in. */
export function codePoints(text: string): string[] {
  return Array.from(text)
}

// The characters loom counts as spaces when it reads a notehead: Python's str.isspace. They are not
// JavaScript's \s, which leaves out \x1c-\x1f and \x85, and counts \uFEFF in.
// oxlint-disable-next-line no-control-regex -- loom counts these control characters as spaces
const SPACE = /^[\t\n\v\f\r\x1c-\x20\x85\xa0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]$/u

/** Whether a character is a space, as loom counts one; past a line's end there is no character,
 * which counts as one. The material has this one notion of a space, so that a passage trimmed of
 * spaces is one loom can write as a quote. */
export function isSpace(character: string | undefined): boolean {
  return character === undefined || SPACE.test(character)
}
