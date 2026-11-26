import type { Bar } from "./shape"

/** A poem's silhouette, drawn from its bars: a picture for the eye only, so it says nothing to
 * assistive technology. */
export function Silhouette({
  bars,
  width,
  height,
  row,
}: {
  bars: readonly Bar[]
  width: number
  height: number
  row: number
}) {
  return (
    <svg
      className="library-shape"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
    >
      {bars.map((bar, i) => (
        <rect key={i} x={bar.x} y={bar.y} width={bar.width} height={row} />
      ))}
    </svg>
  )
}
