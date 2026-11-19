// Emily Dickinson, "A Bird, came down the Walk" (poem 359), as loom keeps its lines, and the
// editor's notes on it: each one's head, as written in loom's notes file, and the spans loom placed
// for it in the textual complex it wrote. Copied from loom's test texts and their output.

export const DICKINSON: readonly { readonly id: string; readonly text: string }[] = [
  { id: "l1", text: "A Bird, came down the Walk -" },
  { id: "l2", text: "He did not know I saw -" },
  { id: "l3", text: "He bit an Angle Worm in halves" },
  { id: "l4", text: "And ate the fellow, raw," },
  { id: "l5", text: "And then, he drank a Dew" },
  { id: "l6", text: "From a convenient Grass -" },
  { id: "l7", text: "And then hopped sidewise to the Wall" },
  { id: "l8", text: "To let a Beetle pass -" },
  { id: "l9", text: "He glanced with rapid eyes," },
  { id: "l10", text: "That hurried all abroad -" },
  { id: "l11", text: "They looked like frightened Beads, I thought," },
  { id: "l12", text: "He stirred his Velvet Head. -" },
  { id: "l13", text: "Like one in danger, Cautious," },
  { id: "l14", text: "I offered him a Crumb," },
  { id: "l15", text: "And he unrolled his feathers," },
  { id: "l16", text: "And rowed him softer Home -" },
  { id: "l17", text: "Than Oars divide the Ocean," },
  { id: "l18", text: "Too silver for a seam," },
  { id: "l19", text: "Or Butterflies, off Banks of Noon," },
  { id: "l20", text: "Leap, plashless as they swim." },
]

export const DICKINSON_NOTES: readonly {
  readonly id: string
  readonly head: string
  readonly spans: readonly (readonly [number, number, number, number])[]
}[] = [
  { id: "bird-violence-1", head: "l2 He ~ l3 halves", spans: [[1, 0, 2, 30]] },
  {
    id: "bird-violence-2",
    head: "l4 fellow && l4 raw",
    spans: [
      [3, 12, 3, 18],
      [3, 20, 3, 23],
    ],
  },
  { id: "bird-convenience-1", head: "l5 ~ l6", spans: [[4, 0, 5, 25]] },
  { id: "bird-convenience-2", head: "l7 ~ l8", spans: [[6, 0, 7, 22]] },
  { id: "bird-afraid-1", head: "l9 ~ l11", spans: [[8, 0, 10, 45]] },
  { id: "bird-afraid-2", head: "l12 ~ l14", spans: [[11, 0, 13, 22]] },
  { id: "bird-flies-1", head: "l15 ~ l16", spans: [[14, 0, 15, 27]] },
  { id: "bird-flies-2", head: "l17 ~ l20", spans: [[16, 0, 19, 29]] },
  {
    id: "poet-projects-1",
    head: "l4 fellow && l8 To let a Beetle pass - && l12 Velvet Head && l14 I offered him a Crumb",
    spans: [
      [3, 12, 3, 18],
      [7, 0, 7, 22],
      [11, 15, 11, 26],
      [13, 0, 13, 21],
    ],
  },
  {
    id: "poet-projects-2",
    head: "l3 ~ l4 && l11 && l13 ~ l14 && l16",
    spans: [
      [2, 0, 3, 24],
      [10, 0, 10, 45],
      [12, 0, 13, 22],
      [15, 0, 15, 27],
    ],
  },
  { id: "poet-achieves-1", head: "l17 ~ l20", spans: [[16, 0, 19, 29]] },
]
