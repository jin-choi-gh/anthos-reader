import { describe, expect, it } from "vitest"
import { LAYERS, layerOf } from "./layers"

// Tests are left out: a test may set up whatever the code under test needs. `assertNever` may be
// used anywhere.

const sources = import.meta.glob<string>(["/src/**/*.ts", "/src/**/*.tsx", "!/src/**/test/**"], {
  query: "?raw",
  import: "default",
  eager: true,
})

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

  it("include every folder of source: a new folder is given a layer, not left to fall into app", () => {
    const unplaced = Object.keys(sources).filter(
      (file) => file.replace(/^\/src\//, "").includes("/") && layerOf(file) === "app",
    )
    expect(unplaced).toEqual([])
  })
})
