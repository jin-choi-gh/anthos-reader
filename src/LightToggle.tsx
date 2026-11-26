import { Moon, Sun } from "./components/icons"
import { chooseLight, useLight } from "./light"
import "./lightToggle.css"

/** Switches between light and dark: a moon while it is light, a sun while it is dark, each what a
 * press brings. */
export function LightToggle() {
  const light = useLight()
  const other = light === "light" ? "dark" : "light"
  const label = `Switch to ${other}`
  return (
    <button
      type="button"
      className="light-toggle"
      aria-label={label}
      title={label}
      onClick={() => chooseLight(other)}
    >
      {other === "dark" ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  )
}
