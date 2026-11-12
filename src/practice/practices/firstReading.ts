import type { Practice } from "../types"

export const firstReading = {
  id: "first-reading",
  title: "First reading",
  text: "dickinson",
  stages: [
    {
      name: "Building up the Bird",
      steps: [
        {
          direction: "consider",
          note: "@angle-worm",
          prose: ["Look at how Dickinson evokes the violence of nature"],
        },
        { direction: "consider", note: "@beads", prose: [""] },
        {
          direction: "respond",
          prose: ["How has the bird changed for you, from its meal to its beads?"], // a placeholder
        },
      ],
    },
    {
      name: "The flight",
      steps: [{ direction: "consider", note: "@flight", prose: ["…"] }],
    },
  ],
} satisfies Practice
