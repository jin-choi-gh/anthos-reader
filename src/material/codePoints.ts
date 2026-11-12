/** A text's characters as the material counts them: code points, not UTF-16 units. Every offset in
 * the material, as loom gives it, indexes this array directly: it is the unit positions are told in. */
export function codePoints(text: string): string[] {
  return Array.from(text)
}
