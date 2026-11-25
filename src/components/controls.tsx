import type { ComponentProps } from "react"
import "./controls.css"

/** A button, in the app's one look for them: quiet, with a finger-sized target. It is type
 * "button" unless given another, so it never sends a form by accident. */
export function Button({ className, type = "button", ...props }: ComponentProps<"button">) {
  return <button type={type} className={classes("button", className)} {...props} />
}

/** A box to write in, in the poem's face. */
export function TextBox({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={classes("text-box", className)} {...props} />
}

/** A box to write one line in: a name, a number. */
export function TextField({ className, type = "text", ...props }: ComponentProps<"input">) {
  return <input type={type} className={classes("text-box text-field", className)} {...props} />
}

/** A field's label: a quiet heading over the box it names. */
export function FieldLabel({ className, ...props }: ComponentProps<"label">) {
  return <label className={classes("field-label", className)} {...props} />
}

/** The same quiet heading over what was written, where there is no box to name. */
export function FieldHeading({ className, ...props }: ComponentProps<"p">) {
  return <p className={classes("field-label", className)} {...props} />
}

function classes(own: string, given: string | undefined): string {
  return given === undefined ? own : `${own} ${given}`
}
