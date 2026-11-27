import { describe, expect, it } from "vitest"
import { formOf, scrolledToShow } from "../disclosedForm"

describe("formOf: how the notes disclosed are drawn, by the step and not the window", () => {
  it("lists a spread's notes in full, however many there are", () => {
    expect(formOf("spread", 1)).toBe("list")
    expect(formOf("spread", 20)).toBe("list")
  })

  it("numbers a page's notes, but draws none for a step of one note", () => {
    expect(formOf("page", 1)).toBe("none")
    expect(formOf("page", 2)).toBe("numbers")
    expect(formOf("page", 20)).toBe("numbers")
  })
})

describe("scrolledToShow: the row of numbers scrolled to show one of them", () => {
  const row = { left: 100, width: 300, total: 1000 }

  it("leaves the row where it is when the number is seen, clear of the edges", () => {
    expect(scrolledToShow({ start: 200, end: 244 }, row, 28)).toBe(100)
  })

  it("scrolls back to show a number before what is seen, clear of the faded edge", () => {
    expect(scrolledToShow({ start: 110, end: 154 }, row, 28)).toBe(82)
    expect(scrolledToShow({ start: 0, end: 44 }, row, 28)).toBe(0)
  })

  it("scrolls on to show a number after what is seen, clear of the faded edge", () => {
    expect(scrolledToShow({ start: 400, end: 444 }, row, 28)).toBe(172)
  })

  it("goes no further than the row's own ends, which are not faded", () => {
    expect(scrolledToShow({ start: 956, end: 1000 }, row, 28)).toBe(700)
    expect(scrolledToShow({ start: 10, end: 54 }, { ...row, left: 50 }, 28)).toBe(0)
  })
})
