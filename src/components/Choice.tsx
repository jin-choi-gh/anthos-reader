import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react"
import { createPortal } from "react-dom"
import { nextEnabled, typedTo } from "./choosingKeys"
import { Check, ChevronDown } from "./icons"
import "./choice.css"

/** One option of a choice: its key, the words it shows, and whether it may not be chosen now. */
export interface ChoiceOption {
  readonly key: string
  readonly label: string
  readonly disabled?: boolean
}

/** A choice of one, written into a sentence: the option chosen, underlined, with a small chevron;
 * pressed, a list of the options opens over the page, the chosen one ticked. It is the select-only
 * combobox of the WAI-ARIA practices: the focus stays on the choice, and the option the keyboard
 * is on is its active descendant. Closed, the arrows, Enter and Space open it, and a letter opens it
 * at the first option starting with it; open, the arrows, Home and End move, a letter jumps,
 * Enter, Space or a click chooses, and Escape, Tab or a press elsewhere closes it, choosing nothing.
 * Options that are disabled can be seen, never chosen. `broken` marks what it holds as a problem. */
export function Choice({
  value,
  options,
  onChange,
  label,
  labelledBy,
  broken = false,
}: {
  value: string
  options: readonly ChoiceOption[]
  onChange: (key: string) => void
  label?: string
  labelledBy?: string
  broken?: boolean
}) {
  const list = useId()
  const optionId = (index: number) => `${list}-${index}`
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const trigger = useRef<HTMLButtonElement>(null)
  const listbox = useRef<HTMLUListElement>(null)
  // What has been typed, to jump to an option by its first letters, and when it is forgotten
  const typed = useRef({ text: "", timer: 0 })
  const chosen = options.findIndex((option) => option.key === value)

  const next = (from: number, by: 1 | -1) => nextEnabled(options, from, by)
  const first = () => next(-1, 1)
  const last = () => next(options.length, -1)

  const openAt = (index: number) => {
    setActive(index)
    setOpen(true)
  }

  const choose = (index: number) => {
    const option = options[index]
    if (option === undefined || option.disabled === true) return
    setOpen(false)
    if (option.key !== value) onChange(option.key)
  }

  /** The option that the letters typed so far begin, looking on from where the keyboard is. What
   * is typed is forgotten after a pause. */
  const jump = (letter: string, from: number): number | null => {
    const memory = typed.current
    window.clearTimeout(memory.timer)
    memory.text += letter
    memory.timer = window.setTimeout(() => {
      memory.text = ""
    }, 600)
    return typedTo(options, memory.text, from)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const { key } = event
    const letter = key.length === 1 && key !== " " && !event.ctrlKey && !event.metaKey
    if (!open) {
      if (key === "ArrowDown" || key === "ArrowUp" || key === "Enter" || key === " ") {
        event.preventDefault()
        openAt(chosen >= 0 && options[chosen]?.disabled !== true ? chosen : first())
      } else if (key === "Home" || key === "End") {
        event.preventDefault()
        openAt(key === "Home" ? first() : last())
      } else if (letter) {
        const found = jump(key, chosen)
        if (found !== null) openAt(found)
      }
      return
    }
    switch (key) {
      case "ArrowDown":
        event.preventDefault()
        setActive(next(active, 1))
        return
      case "ArrowUp":
        event.preventDefault()
        if (event.altKey) choose(active)
        else setActive(next(active, -1))
        return
      case "Home":
        event.preventDefault()
        setActive(first())
        return
      case "End":
        event.preventDefault()
        setActive(last())
        return
      case "Enter":
      case " ":
        event.preventDefault()
        choose(active)
        return
      case "Escape":
        event.preventDefault()
        setOpen(false)
        return
      case "Tab":
        setOpen(false)
        return
      default:
        if (letter) {
          const found = jump(key, active)
          if (found !== null) setActive(found)
        }
    }
  }

  // A press anywhere but the choice and its list closes it
  useEffect(() => {
    if (!open) return
    const elsewhere = (event: PointerEvent) => {
      const target = event.target as Node
      if (trigger.current?.contains(target) || listbox.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener("pointerdown", elsewhere)
    return () => document.removeEventListener("pointerdown", elsewhere)
  }, [open])

  // The list over the page, under the choice, or above it when there is more room there, kept within
  // the window, and following the choice as the page scrolls or the window changes
  useLayoutEffect(() => {
    const element = listbox.current
    const button = trigger.current
    if (!open || element === null || button === null) return
    const place = () => {
      const at = button.getBoundingClientRect()
      const margin = 8
      const below = window.innerHeight - at.bottom - margin
      const above = at.top - margin
      const wanted = Math.min(element.scrollHeight, 320)
      const up = below < wanted && above > below
      element.style.minWidth = `${Math.max(at.width, 192)}px`
      element.style.maxHeight = `${Math.max(Math.min(up ? above : below, 320) - 4, 120)}px`
      const width = element.offsetWidth
      element.style.left = `${Math.max(margin, Math.min(at.left - 6, window.innerWidth - width - margin))}px`
      element.style.top = up ? "" : `${at.bottom + 4}px`
      element.style.bottom = up ? `${window.innerHeight - at.top + 4}px` : ""
    }
    place()
    window.addEventListener("resize", place)
    window.addEventListener("scroll", place, true)
    return () => {
      window.removeEventListener("resize", place)
      window.removeEventListener("scroll", place, true)
    }
  }, [open])

  // The option the keyboard is on, kept in view in a long list
  useEffect(() => {
    if (!open || active < 0) return
    document.getElementById(`${list}-${active}`)?.scrollIntoView({ block: "nearest" })
  }, [open, active, list])

  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="choice"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? list : undefined}
        aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
        aria-label={label}
        aria-labelledby={labelledBy}
        data-broken={broken}
        onClick={() => (open ? setOpen(false) : openAt(chosen >= 0 ? chosen : first()))}
        onKeyDown={onKeyDown}
      >
        <span className="choice-value">{options[chosen]?.label ?? ""}</span>
        <ChevronDown size={14} />
      </button>
      {open &&
        createPortal(
          <ul
            ref={listbox}
            id={list}
            className="choice-list"
            role="listbox"
            tabIndex={-1}
            aria-label={label}
            aria-labelledby={labelledBy}
          >
            {options.map((option, i) => (
              <li
                key={option.key}
                id={optionId(i)}
                className="choice-option"
                role="option"
                aria-selected={i === chosen}
                aria-disabled={option.disabled === true ? true : undefined}
                data-active={i === active}
                // The focus stays on the choice, so that the keyboard goes on working
                onPointerDown={(event) => event.preventDefault()}
                onPointerMove={() => {
                  if (option.disabled !== true && i !== active) setActive(i)
                }}
                onClick={() => choose(i)}
              >
                <span className="choice-tick">{i === chosen && <Check size={14} />}</span>
                <span>{option.label}</span>
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </>
  )
}
