import { describe, expect, it } from "vitest"
import { formHref, libraryHref, parseRoute, readerHref } from "../route"

describe("parseRoute", () => {
  it("reads #/read/<file> as the reader for that file, in practice mode", () => {
    expect(parseRoute("#/read/dickinson")).toEqual({
      screen: "reader",
      file: "dickinson",
      mode: "practice",
    })
  })

  it("reads #/read/<file>/annotate as the reader for that file, in annotate mode", () => {
    expect(parseRoute("#/read/dickinson/annotate")).toEqual({
      screen: "reader",
      file: "dickinson",
      mode: "annotate",
    })
  })

  it("reads #/form/<file> as Form Practice for that file", () => {
    expect(parseRoute("#/form/dickinson")).toEqual({
      screen: "form",
      file: "dickinson",
      fresh: false,
    })
    expect(parseRoute("#/form/dickinson/new")).toEqual({
      screen: "form",
      file: "dickinson",
      fresh: true,
    })
  })

  it("reads everything else as the library", () => {
    const hashes = [
      "",
      "#",
      "#/",
      "#/read/",
      "#/read//annotate",
      "#/read/dickinson/",
      "#/read/dickinson/other",
      "#/read/dickinson/annotate/",
      "#/elsewhere",
      "#/form/",
      "#/form/dickinson/",
      "#/form/dickinson/annotate",
      "#/form/dickinson/new/",
      libraryHref,
    ]
    for (const hash of hashes) {
      expect(parseRoute(hash)).toEqual({ screen: "library" })
    }
  })
})

describe("readerHref", () => {
  it("leaves practice mode out of the URL, as the default", () => {
    expect(readerHref("dickinson")).toBe("#/read/dickinson")
    expect(readerHref("dickinson", "practice")).toBe("#/read/dickinson")
    expect(readerHref("dickinson", "annotate")).toBe("#/read/dickinson/annotate")
  })

  it("gives back to parseRoute the file and mode it was given, whatever the file's characters", () => {
    const file = "poème 12/b"
    for (const mode of ["practice", "annotate"] as const) {
      expect(parseRoute(readerHref(file, mode))).toEqual({ screen: "reader", file, mode })
    }
  })
})

describe("formHref", () => {
  it("gives back to parseRoute the file it was given, whatever the file's characters", () => {
    expect(formHref("dickinson")).toBe("#/form/dickinson")
    const file = "poème 12/b"
    expect(parseRoute(formHref(file))).toEqual({ screen: "form", file, fresh: false })
    expect(parseRoute(formHref(file, true))).toEqual({ screen: "form", file, fresh: true })
  })
})
