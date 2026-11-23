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

/** Move up: an arrow pointing up. */
export function ArrowUp(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 19V5M6 11l6-6 6 6" />
    </Icon>
  )
}

/** Move down: an arrow pointing down. */
export function ArrowDown(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5v14M6 13l6 6 6-6" />
    </Icon>
  )
}

/** Remove: a bin, since an × closes. */
export function Bin(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
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
