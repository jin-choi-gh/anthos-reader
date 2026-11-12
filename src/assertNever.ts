/** For the end of a switch over a union: TypeScript accepts the call only when every case has been
 * handled, and when one is missing it names that case. If one slips through anyway, as with data
 * from outside, it throws rather than going on with nothing. */
export function assertNever(value: never): never {
  throw new Error(`unhandled case: ${JSON.stringify(value)}`)
}
