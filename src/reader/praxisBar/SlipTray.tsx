import { useId, useLayoutEffect, useRef } from "react"
import { Button, FieldHeading } from "../../components/controls"
import type { PraxisBarProtocol, SlipsProjection } from "../scenes/types"

/** Where the keyboard's focus goes once the scene has answered a take or a check: to the next free
 * slip after the one taken, or the first free one; to Check, once every slip is in a gap; or, the
 * poem whole, to the words that say so. */
type Focus = { after: number } | { kind: "first" } | null

/** The restore's slips, in the praxis bar: how many gaps are restored; every slip in its place, a
 * button that takes it into the first empty gap, which once in a gap keeps its place in the tray as
 * an outline, green once matched; and Check, in a row of its own, with what the last check gave back,
 * or why Check waits. Once every gap is restored, it says that the poem is whole. A taken slip, or
 * Check, gives the focus on as it goes, so that a reader on the keyboard never loses their place. */
export function SlipTray({
  tray,
  send,
}: {
  tray: SlipsProjection
  send: (message: PraxisBarProtocol["toScene"]) => void
}) {
  const label = useId()
  const slips = useRef<HTMLDivElement>(null)
  const check = useRef<HTMLButtonElement>(null)
  const whole = useRef<HTMLParagraphElement>(null)
  const focus = useRef<Focus>(null)

  // After the scene has answered, the focus goes where the move left it
  useLayoutEffect(() => {
    const wanted = focus.current
    if (wanted === null) return
    focus.current = null
    if (tray.whole) return whole.current?.focus()
    const free = [...(slips.current?.querySelectorAll<HTMLButtonElement>(".slip") ?? [])]
    const from = "after" in wanted ? wanted.after + 1 : 0
    const ahead = [...free.slice(from), ...free.slice(0, from)].find((slip) => !slip.disabled)
    if (ahead !== undefined) return ahead.focus()
    check.current?.focus()
  })

  const why =
    tray.returned !== null && tray.returned > 0
      ? `${tray.returned} slips came back: their gaps are open again.`
      : tray.canCheck
        ? ""
        : "Check once every gap is filled."

  return (
    <div className="slips">
      <div className="slips-head">
        <FieldHeading id={label}>slips</FieldHeading>
        <span className="slips-count">
          {tray.restored} of {tray.gaps} restored
        </span>
      </div>
      {tray.whole ? (
        <p className="slips-whole" ref={whole} tabIndex={-1} role="status">
          The poem is whole again.
        </p>
      ) : (
        <>
          <div
            className="slips-tray"
            data-of={tray.of}
            role="group"
            aria-labelledby={label}
            ref={slips}
          >
            {tray.slips.map((slip, i) => (
              <button
                key={i}
                type="button"
                className="slip"
                disabled={slip.placed}
                data-restored={slip.restored}
                onClick={() => {
                  focus.current = { after: i }
                  send({ kind: "take", slip: i })
                }}
              >
                {slip.text}
              </button>
            ))}
          </div>
          <div className="slips-check">
            <p className="slips-why" role="status">
              {why}
            </p>
            <Button
              ref={check}
              className="button--restore slips-check-button"
              disabled={!tray.canCheck}
              onClick={() => {
                focus.current = { kind: "first" }
                send({ kind: "check" })
              }}
            >
              check
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
