// The JSON loom writes for one version: loom/src/exports/version_json.py, format_version 1.

/** [index of the line in `lines`, character offset within that line] */
export type LoomPosition = [line: number, offset: number]

export interface LoomSpan {
  start: LoomPosition
  end: LoomPosition
}

export interface LoomLine {
  id: string
  text: string
}

export interface LoomUnit extends LoomSpan {
  id: string
  rank: string
  value: string | null
  parent: string | null
}

export interface LoomSchema {
  kind: string
  units: LoomUnit[]
}

export interface LoomAtom extends LoomSpan {
  text: string
  innermost: Record<string, string> // schema name → unit id
}

export interface LoomAnnotation {
  targets: LoomSpan[]
  body: string
}

export interface LoomVersionMetadata {
  title: string | null
  author: string | null
}

export interface LoomVersion {
  format: "loom-version"
  format_version: 1
  name: string | null
  metadata: LoomVersionMetadata
  lines: LoomLine[]
  schemata: Record<string, LoomSchema>
  atoms: LoomAtom[]
  annotations: Record<string, LoomAnnotation[]>
}
