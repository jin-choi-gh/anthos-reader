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
