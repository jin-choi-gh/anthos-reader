import type { Practice } from "../types"

export const firstReading = {
  id: "first-reading",
  title: "First reading",
  text: "dickinson",
  stages: [
    // {
    //   name: "The Form",
    //   steps: [

    //   ]
    // },
    {
      name: "The Bird and His Flight",
      steps: [
        {
          direction: "reflect",
          prose: ["Read this poem on a bird's fleet-footed acts and his eventual flight."]
        },
        {
          direction: "consider",
          note: "@bird-violence-1",
          prose: ["In the beginning the bird is an agent of violence"]
        },
        {
          direction: "consider",
          prose: ["Consider how sonic features add to the poem's power of evocation"],
          note: "@bird-violence-2",
        },
        {
          direction: "consider",
          prose: ["Is the brutality of nature the only note?"],
          note: "@bird-convenience-1",
        },
        {
          direction: "consider",
          prose: ["How are we to consider the bird?"],
          note: "@bird-convenience-2",
        },
        {
          direction: "consider",
          prose: ["By the middle of the poem, the bird has lost its ferocity. It now appears as a creature paranoid and out of place."],
          note: "@bird-afraid-1",
        },
        {
          direction: "consider",
          prose: ["What does it mean for the poet to intervene within the acts of their own poem? What does it mean for the human being to intervene within the unfolding of nature?"],
          note: "@bird-afraid-2",
        },
        {
          direction: "consider",
          prose: ["The bird steps into flight - what do you make of this sudden motion?"],
          note: "@bird-flies-1"
        },
        {
          direction: "consider",
          prose: ["This is a final stanza of metamorphosis: the bird's flight is not merely one of movement, but also of transformation."],
          note: "@bird-flies-2",
        },
        {
          direction: "respond",
          prose: ["For one critic, this poem was understood to imply the ultimate triumph of beauty over the callous reality of nature. Do you agree?"],
        }
      ],
    },
    {
      name: "Nature and the Human Being",
      steps: [
        {
          direction: "recall",
          prose: ["Read your response below from the previous stage"]
        },
        {
          direction: "reflect",
          prose: [
            "In the previous stage, we contemplated the transformation of the bird within the poem.",
            "In this stage, we will think more about the poet's relationship to the bird."
          ],
        },
        {
          direction: "consider",
          prose: ["The poet's vicarious life"],
          note: "@poet-projects-1"
        },
        {
          direction: "observe",
          prose: ["Can you observe yourself some parts of the poem where the poet projects her own feelings into the life of the bird?"],
        },
        {
          direction: "consider",
          prose: ["The instability of vicarious understanding"],
          note: "@poet-projects-2"
        },
        {
          direction: "consider",
          prose: ["The high note: the poet achieves"],
          note: "@poet-achieves-1"
        }
      ]
    },
  ],
} satisfies Practice
