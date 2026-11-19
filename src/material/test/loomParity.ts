// What loom does with each notehead below, on the lines below: the spans it places, as
// [start line, start offset, end line, end offset], or null where it refuses. Written by
// running loom itself, at the commit named; not to be edited by hand.

export const LOOM_COMMIT = "2cab1d9"

export const LINES: readonly { readonly id: string; readonly text: string }[] = [
  { id: "l1", text: "aaa" },
  { id: "l2", text: "x ~ y && z" },
  { id: "l3", text: "" },
  { id: "l4", text: "note[3] and ever ever" },
  { id: "l5", text: "b &&" },
  { id: "l6", text: "the \ud83d\udc26 Walk - caf\u00e9" },
  { id: "l7", text: "a\u001fb c\ufeffd" },
  { id: "l8", text: "~ lead and trail ~" },
  { id: "l9", text: "ever, ever, never" },
]

export const CASES: readonly {
  readonly notehead: string
  readonly loom: readonly (readonly [number, number, number, number])[] | null
}[] = [
  { notehead: "l1", loom: [[0, 0, 0, 3]] },
  { notehead: "l9", loom: [[8, 0, 8, 17]] },
  { notehead: "l1 ~ l2", loom: [[0, 0, 1, 10]] },
  { notehead: "l3", loom: [[2, 0, 2, 0]] },
  { notehead: "l9 ~ l4", loom: null },
  { notehead: "l1 a", loom: [[0, 0, 0, 1]] },
  { notehead: "l1 a[3]", loom: [[0, 2, 0, 3]] },
  { notehead: "l1 a[4]", loom: null },
  { notehead: "l1 aa", loom: [[0, 0, 0, 2]] },
  { notehead: "l1 aa[2]", loom: null },
  { notehead: "l1 a[2] ~ l1 a[3]", loom: [[0, 1, 0, 3]] },
  { notehead: "l4 ever", loom: [[3, 12, 3, 16]] },
  { notehead: "l4 ever[2]", loom: [[3, 17, 3, 21]] },
  { notehead: "l4 ever[3]", loom: null },
  { notehead: "l9 ever[3]", loom: [[8, 13, 8, 17]] },
  { notehead: "l4 note", loom: [[3, 0, 3, 4]] },
  { notehead: "l4 note[3]", loom: null },
  { notehead: "l4 note[3][1]", loom: [[3, 0, 3, 7]] },
  { notehead: "l4 worm", loom: null },
  { notehead: "l99", loom: null },
  { notehead: "", loom: null },
  { notehead: "l4 ever [2]", loom: null },
  { notehead: "l4  ever", loom: null },
  { notehead: "l4 ever[0]", loom: null },
  { notehead: "l4 ever[00]", loom: null },
  { notehead: "l1 a ~ l2 x ~ l4", loom: null },
  { notehead: "l1 && ", loom: null },
  { notehead: "l1 &&  && l2", loom: null },
  { notehead: "l2 ~ y", loom: null },
  { notehead: "l2 x ~ y", loom: null },
  { notehead: "l2 ~[1] ~ l2 y", loom: [[1, 2, 1, 5]] },
  { notehead: "l2 &&", loom: [[1, 6, 1, 8]] },
  { notehead: "l2 && z", loom: null },
  { notehead: "l2 &&[1] ~ l2 z", loom: [[1, 6, 1, 10]] },
  { notehead: "l5 b && && l1", loom: null },
  {
    notehead: "l5 b &&[1] && l1",
    loom: [
      [4, 0, 4, 4],
      [0, 0, 0, 3],
    ],
  },
  {
    notehead: "l2 x && l4 ever",
    loom: [
      [1, 0, 1, 1],
      [3, 12, 3, 16],
    ],
  },
  {
    notehead: "l2 x &&  l4 ever",
    loom: [
      [1, 0, 1, 1],
      [3, 12, 3, 16],
    ],
  },
  { notehead: "l8 ~ lead", loom: null },
  { notehead: "l8 ~[1] ~ l8 ~[2]", loom: [[7, 0, 7, 18]] },
  { notehead: "l8 ~[2]", loom: [[7, 17, 7, 18]] },
  { notehead: "l1 ~ l1 a", loom: null },
  { notehead: "l4 ever[2] ~ l4 ever", loom: null },
  { notehead: "l4 ever ~ l4 ever", loom: [[3, 12, 3, 16]] },
  { notehead: "l4 ever ~ l9 never", loom: [[3, 12, 8, 17]] },
  { notehead: "l6 \ud83d\udc26", loom: [[5, 4, 5, 5]] },
  { notehead: "l6 \ud83d\udc26 Walk", loom: [[5, 4, 5, 10]] },
  { notehead: "l6 Walk", loom: [[5, 6, 5, 10]] },
  { notehead: "l6 caf\u00e9", loom: [[5, 13, 5, 17]] },
  { notehead: "l6 cafe\u0301", loom: [[5, 13, 5, 17]] },
  { notehead: "l1\u001f", loom: [[0, 0, 0, 3]] },
  { notehead: "l1\ufeff", loom: null },
  { notehead: "l7 b c", loom: [[6, 2, 6, 5]] },
  { notehead: "l7 \u001fb", loom: null },
  { notehead: "l7 a\u001fb", loom: [[6, 0, 6, 3]] },
  { notehead: "l7 c\ufeffd", loom: [[6, 4, 6, 7]] },
  { notehead: " l1", loom: [[0, 0, 0, 3]] },
  { notehead: "\tl1", loom: [[0, 0, 0, 3]] },
  { notehead: "l1\u0085", loom: [[0, 0, 0, 3]] },
  { notehead: "l4 ever[\u0662]", loom: [[3, 17, 3, 21]] },
]
