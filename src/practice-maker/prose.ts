/** A step's prose as written in one box: its paragraphs, each trimmed, parted wherever a blank
 * line is, however many there are; none when the box says nothing. A single line break stays in
 * its paragraph. */
export function paragraphsOf(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph !== "")
}

/** A step's prose as text for one box: its paragraphs parted by a blank line, so that
 * paragraphsOf gives them back. */
export function proseText(prose: readonly string[]): string {
  return prose.join("\n\n")
}
