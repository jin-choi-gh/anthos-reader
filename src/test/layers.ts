// The layers of CONCEPT.md, "Who may know whom". Each may import from itself and from the layers
// listed for it, and nothing else. architecture.test.ts checks the imports against this table, and
// concept.test.ts checks that CONCEPT.md gives every layer a place.

export const LAYERS: Readonly<Record<string, readonly string[]>> = {
  material: [], // the footage: knows nothing else
  loom: ["material"], // develops loom's JSON into the footage
  practice: ["material"], // the reel
  clock: [], // the time, and which day it is
  storage: [], // where the logs are kept
  notebook: ["material", "practice", "clock", "storage"], // the reader's notebook
  runner: ["material", "practice", "clock", "notebook", "storage"], // the projector
  "reader/frame": ["material", "practice", "runner", "notebook", "reader/scenes"],
  "reader/scenes": ["material", "notebook"], // the scene: never the reel or the projector
  "reader/viewer": ["material", "reader/scenes", "ui"], // the main screen
  // the intertitle, the notebook page and the projector's controls
  "reader/praxisBar": ["clock", "runner", "reader/frame", "reader/scenes", "ui"],
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
  ], // the screen for one text: puts it all together
  library: ["loom", "app"],
  ui: [],
  app: ["library", "reader"], // App, main, the route
}

/** The layer a source file belongs to, by its path from the root ("/src/runner/gate.ts"): the
 * longest layer path its folder starts with, or "app" for the files directly in src/. */
export function layerOf(file: string): string {
  const path = file.replace(/^\/src\//, "")
  const layers = Object.keys(LAYERS).sort((a, b) => b.length - a.length)
  return layers.find((layer) => path.startsWith(`${layer}/`)) ?? "app"
}
