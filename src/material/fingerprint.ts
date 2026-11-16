import type { Fingerprint, Substrate } from "./types"

/** The substrate's fingerprint: the hash of its lines joined by line breaks. A line never holds a
 * line break, so different lines never join to the same text. */
export function fingerprintOf(substrate: Substrate): Fingerprint {
  return hashOf(substrate.lines.join("\n")) as Fingerprint
}

/** A text's hash, behind every fingerprint: 53 bits (cyrb53), as 14 hex digits. The same text always
 * gives the same hash, and different texts almost surely different ones. */
export function hashOf(text: string): string {
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 2654435761)
    h2 = Math.imul(h2 ^ c, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  const hash = 4294967296 * (2097151 & h2) + (h1 >>> 0)
  return hash.toString(16).padStart(14, "0")
}
