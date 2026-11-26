import type { SVGProps } from "react"

/** An icon's size in pixels, square; 20 unless given. */
interface IconProps {
  size?: number
}

/** The app's icons: strokes on a 24 × 24 grid, 1.8 wide, round caps and joins, drawn in the text's
 * colour (currentColor), so they follow the theme. Decorative: the label beside an icon, or its
 * button's aria-label, says what it means. */
function Icon({ size = 20, children, ...props }: SVGProps<SVGSVGElement> & IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

/** Back: a "<" pointing the way you came. */
export function ChevronLeft(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M15 5l-7 7 7 7" />
    </Icon>
  )
}

/** Close: an "×". */
export function Close(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Icon>
  )
}

/** Annotate: a pen, nib down to the left. */
export function Pen(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M15 5l4 4L8 20H4v-4L15 5z" />
      <path d="M13 7l4 4" />
    </Icon>
  )
}

/** Light: a sun. */
export function Sun(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6L7 7M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" />
    </Icon>
  )
}

/** Dark: a crescent moon. */
export function Moon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 14.2A8.3 8.3 0 1 1 9.8 4a6.6 6.6 0 0 0 10.2 10.2z" />
    </Icon>
  )
}

/** A choice to open: a "v" pointing down. */
export function ChevronDown(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 9l6 6 6-6" />
    </Icon>
  )
}

/** Chosen: a tick. */
export function Check(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Icon>
  )
}
