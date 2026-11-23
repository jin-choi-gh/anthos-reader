/** An option as the keyboard moves among them: the words it shows, and whether it may be chosen. */
interface Option {
  readonly label: string
  readonly disabled?: boolean
}

/** The next option that may be chosen from a place, going one way, without wrapping round; the
 * place itself when there is none. From -1 going on, it is the first; from the length going back,
 * the last. */
export function nextEnabled(options: readonly Option[], from: number, by: 1 | -1): number {
  for (let i = from + by; i >= 0 && i < options.length; i += by) {
    if (options[i]?.disabled !== true) return i
  }
  return from
}

/** The option whose words begin with what was typed, ignoring case, looking from a place round to
 * it again: on from the place itself when more than one letter is typed, so that typing on stays on
 * the option found, and from the one after when only one is, so that the same letter again moves
 * on. Options that may not be chosen are passed over; null when none begins so. */
export function typedTo(options: readonly Option[], typed: string, from: number): number | null {
  const text = typed.toLowerCase()
  if (text === "" || options.length === 0) return null
  const start = text.length === 1 ? from + 1 : from
  for (let k = 0; k < options.length; k++) {
    const i = (((start + k) % options.length) + options.length) % options.length
    const option = options[i]
    if (
      option !== undefined &&
      option.disabled !== true &&
      option.label.toLowerCase().startsWith(text)
    ) {
      return i
    }
  }
  return null
}
