import { describe, expect, it } from "vitest"
import { libraryHref, parseRoute, readerHref } from "../route"

describe("parseRoute", () => {
  it("reads #/read/<file> as the reader for that file", () => {
    expect(parseRoute("#/read/dickinson")).toEqual({ screen: "reader", file: "dickinson" })
  })

  it("reads everything else as the library", () => {
    for (const hash of ["", "#", "#/", "#/read/", "#/elsewhere", libraryHref]) {
      expect(parseRoute(hash)).toEqual({ screen: "library" })
    }
  })

  it("gives back the file readerHref was given, whatever its characters", () => {
    const file = "poème 12/b"
    expect(parseRoute(readerHref(file))).toEqual({ screen: "reader", file })
  })
})
