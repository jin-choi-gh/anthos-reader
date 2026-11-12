import type { Practice } from "../types"

export const firstReading: Practice = {
  id: "first-reading",
  title: "First reading",
  text: "dickinson",
  stages: [
    {
      name: "The meal",
      steps: [
        {
          verb: "consider",
          note: "@angle-worm",
          prose: ["Look at how Dickinson evokes the violence of nature"],
        },
        { verb: "consider", note: "@beads", prose: [""] },
      ],
    },
    {
      name: "The flight",
      steps: [{ verb: "consider", note: "@flight", prose: ["…"] }],
    },
  ],
}
