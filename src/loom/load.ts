import type { LoomVersion } from "./types"

// Every version file in anthos-reader/data/, found by Vite when it builds the app:
// file path → a function that loads that one file. A REST API would replace this later.
const files = import.meta.glob<unknown>("../../text-data/*.json", { import: "default" })

/** The versions in data/, by file name: data/vendler.json gives "vendler". */
export function versionFiles(): string[] {
  return Object.keys(files).map(fileName).sort()
}

/** A version from data/, by file name, checked to be one this reader understands. */
export async function loadVersion(file: string): Promise<LoomVersion> {
  const path = `../../text-data/${file}.json`
  const load = files[path]
  if (load === undefined) {
    const known = versionFiles().join(", ") || "none"
    throw new Error(`text-data/${file}.json: no such file (text-data/ has: ${known})`)
  }
  return parseVersion(await load(), `text-data/${file}.json`)
}

/** Parsed JSON checked to be a loom version this reader understands. `origin` names it in errors. */
export function parseVersion(data: unknown, origin: string): LoomVersion {
  if (!isObject(data) || data.format !== "loom-version") {
    throw new Error(`${origin}: not a loom version`)
  }
  if (data.format_version !== 1) {
    throw new Error(
      `${origin}: format version ${String(data.format_version)}, but this reader reads version 1`
    )
  }
  return data as unknown as LoomVersion
}

function fileName(path: string): string {
  return path.slice(path.lastIndexOf("/") + 1, -".json".length)
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
