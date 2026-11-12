import { describe, expect, it } from "vitest"

// The layers, as CONCEPT.md draws them: the print, the lab, the reel, the projector, the screen.
// Each may import from itself and from the layers listed for it, and nothing else. Tests are left
// out: a test may set up whatever the code under test needs. `assertNever` may be used anywhere.

const LAYERS: Record<string, readonly string[]> = {
  material: [], // the print: knows nothing else
  loom: ["material"], // the lab: develops loom's JSON into the print
  practice: ["material"], // the reel
  clock: [], // the house clock: the time, and which day it is
  storage: [], // the shelf the logs are kept on
  notebook: ["material", "practice", "clock", "storage"], // the spectator's notebook
  runner: ["material", "practice", "clock", "notebook", "storage"], // the projector
  "reader/frame": ["material", "practice", "runner", "notebook", "reader/scenes"],
  "reader/scenes": ["material", "notebook"], // staging: never the reel or the projector
  "reader/viewer": ["material", "reader/scenes", "ui"], // the main screen
  "reader/praxisBar": ["clock", "runner", "reader/frame", "reader/scenes", "ui"], // intertitles, booth
  "reader/dev": ["practice", "clock", "runner", "notebook"],
  reader: [
    "material",
    "loom",
    "practice",
    "clock",
    "notebook",
    "runner",
    "reader/frame",
    "reader/scenes",
    "reader/viewer",
    "reader/praxisBar",
    "reader/dev",
    "app",
    "ui",
  ], // the screening room: puts it all together
  library: ["loom", "app"],
  ui: [],
  app: ["library", "reader"], // App, main, the route
}

const sources = import.meta.glob<string>(["/src/**/*.ts", "/src/**/*.tsx", "!/src/**/test/**"], {
  query: "?raw",
  import: "default",
  eager: true,
})

/** The layer a file belongs to: the longest layer path its folder starts with, or "app" for the
 * files directly in src/. */
function layerOf(file: string): string {
  const path = file.replace(/^\/src\//, "")
  const layers = Object.keys(LAYERS).sort((a, b) => b.length - a.length)
  return layers.find((layer) => path.startsWith(`${layer}/`)) ?? "app"
}

/** A relative import as a path from the root: "/src/reader/frame/frame.ts" importing
 * "../scenes/types" is "/src/reader/scenes/types". */
function resolve(from: string, specifier: string): string {
  const parts = from.split("/").slice(0, -1)
  for (const part of specifier.split("/")) {
    if (part === "..") parts.pop()
    else if (part !== ".") parts.push(part)
  }
  return parts.join("/")
}

const IMPORT = /\b(?:from|import)\s+["'](\.{1,2}\/[^"']+)["']/g

const crossings = Object.entries(sources).flatMap(([file, text]) =>
  [...text.matchAll(IMPORT)].map((match) => {
    const target = resolve(file, match[1] ?? "")
    return { file, target, from: layerOf(file), to: layerOf(target) }
  }),
)

describe("the layers", () => {
  it("finds the source files and their imports", () => {
    expect(Object.keys(sources).length).toBeGreaterThan(30)
    expect(crossings.length).toBeGreaterThan(50)
  })

  it("import only from themselves and the layers below them", () => {
    const wrong = crossings
      .filter(({ target }) => !target.endsWith("/src/assertNever"))
      .filter(({ from, to }) => from !== to && !(LAYERS[from] ?? []).includes(to))
      .map(({ file, target, from, to }) => `${file} (${from}) imports ${target} (${to})`)
    expect(wrong).toEqual([])
  })
})
