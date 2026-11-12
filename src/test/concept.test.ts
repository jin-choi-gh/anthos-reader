import { describe, expect, it } from "vitest"
import concept from "../../CONCEPT.md?raw"
import { LAYERS } from "./layers"

// CONCEPT.md links to the code it names. These tests follow the links, so that the file and the code
// cannot drift apart unnoticed.

const sources = import.meta.glob<string>(["/src/**/*.ts", "/src/**/*.tsx", "/src/**/*.css"], {
  query: "?raw",
  import: "default",
  eager: true,
})

/** The file's text outside its code blocks, and the lines inside its TypeScript blocks. */
const prose = concept.replace(/```[\s\S]*?```/g, "")
const quoted = [...concept.matchAll(/```ts\n([\s\S]*?)```/g)].flatMap((block) =>
  (block[1] ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== ""),
)

/** Every link to the code: its text, and where it leads, from the root ("src/runner/gate.ts"). */
const links = [...prose.matchAll(/\[([^\]]+)\]\(([^)\s#]+)\)/g)]
  .map((match) => ({ text: match[1] ?? "", target: match[2] ?? "" }))
  .filter(({ target }) => target.startsWith("src/"))

// Vite leaves the importing file out of its own glob
const self = "src/test/concept.test.ts"
const isFile = (target: string) => target === self || `/${target}` in sources
const isFolder = (target: string) =>
  target.endsWith("/") && Object.keys(sources).some((file) => file.startsWith(`/${target}`))

const squash = (text: string) => text.replace(/\s+/g, " ")
const everySource = squash(Object.values(sources).join("\n"))

describe("CONCEPT.md", () => {
  it("links to the code", () => {
    expect(links.length).toBeGreaterThan(50)
    expect(quoted.length).toBeGreaterThan(10)
  })

  it("links only to files and folders that are there", () => {
    const broken = links.filter(({ target }) => !isFile(target) && !isFolder(target))
    expect(broken).toEqual([])
  })

  it("links each name it mentions to the file that declares it", () => {
    const misplaced = links
      .map(({ text, target }) => ({
        // a name, or a name and a member ("Standing.heldAt"), but not a file ("route.ts")
        name: /^`([A-Za-z_$][\w$]*)(?:\.(?!(?:tsx?|css)`)\w+)?`$/.exec(text)?.[1],
        target,
      }))
      .filter(({ name, target }) => name !== undefined && isFile(target))
      .filter(({ name, target }) => {
        const declaration = new RegExp(
          `\\bexport\\s+(?:async\\s+)?(?:function|const|let|class|interface|type|enum)\\s+${name}\\b`,
        )
        return !declaration.test(sources[`/${target}`] ?? "")
      })
    expect(misplaced).toEqual([])
  })

  it("quotes only code that is in the source", () => {
    const missing = quoted.filter((line) => !everySource.includes(squash(line)))
    expect(missing).toEqual([])
  })

  it("gives every layer a place", () => {
    const folderOf = (layer: string) => (layer === "app" ? "src/App.tsx" : `src/${layer}/`)
    const linked = new Set(links.map(({ target }) => target))
    const absent = Object.keys(LAYERS).filter((layer) => !linked.has(folderOf(layer)))
    expect(absent).toEqual([])
  })
})
