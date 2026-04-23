export type DifficultyLevel = "Beginner" | "Intermediate" | "Advanced";

export interface BookPassage {
  id: string;
  label: string;
  text: string;
}

export interface ClassicBook {
  id: string;
  title: string;
  author: string;
  difficulty: DifficultyLevel;
  shortDescription: string;
  passages: BookPassage[];
}

export const typingGoalWpm = 45;

export const books: ClassicBook[] = [
  {
    id: "pride-and-prejudice",
    title: "Pride and Prejudice",
    author: "Jane Austen",
    difficulty: "Beginner",
    shortDescription:
      "Clear sentence structure and conversational pacing make this ideal for building rhythm.",
    passages: [
      {
        id: "pp-1",
        label: "Chapter 1 Opening",
        text:
          "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife. However little known the feelings or views of such a man may be, this truth is so well fixed in the minds of the surrounding families, that he is considered as the rightful property of some one or other of their daughters."
      },
      {
        id: "pp-2",
        label: "Mr. Bennet Teasing",
        text:
          "Mr. Bennet was among the earliest of those who waited on Mr. Bingley. He had always intended to visit him, though to the last always assuring his wife that he should not go; and till the evening after the visit was paid she had no knowledge of it."
      },
      {
        id: "pp-3",
        label: "Elizabeth Observes",
        text:
          "Elizabeth listened in silence, but was not convinced; their behavior at the assembly had not been calculated to please in general; and with more quickness of observation and less pliancy of temper than her sister, and with a judgment too unassailed by any attention to herself, she was very little disposed to approve them."
      },
      {
        id: "pp-4",
        label: "Letter Reflection",
        text:
          "She grew absolutely ashamed of herself. Of neither Darcy nor Wickham could she think, without feeling she had been blind, partial, prejudiced, absurd. Till this moment, she never knew herself."
      }
    ]
  },
  {
    id: "sherlock-holmes",
    title: "The Adventures of Sherlock Holmes",
    author: "Arthur Conan Doyle",
    difficulty: "Intermediate",
    shortDescription:
      "Great for speed bursts: vivid detail, direct dialogue, and strong narrative momentum.",
    passages: [
      {
        id: "sh-1",
        label: "A Scandal in Bohemia",
        text:
          "To Sherlock Holmes she is always the woman. I have seldom heard him mention her under any other name. In his eyes she eclipses and predominates the whole of her sex. It was not that he felt any emotion akin to love for Irene Adler."
      },
      {
        id: "sh-2",
        label: "Observation Skills",
        text:
          "You see, but you do not observe. The distinction is clear. For example, you have frequently seen the steps which lead up from the hall to this room. Frequently. How often? Well, some hundreds of times. Then how many are there?"
      },
      {
        id: "sh-3",
        label: "Case Preparation",
        text:
          "My dear fellow, life is infinitely stranger than anything which the mind of man could invent. We would not dare to conceive the things which are really mere commonplaces of existence."
      },
      {
        id: "sh-4",
        label: "Closing Insight",
        text:
          "There is nothing more deceptive than an obvious fact. We balance probabilities and choose the most likely. It is the scientific use of the imagination."
      }
    ]
  },
  {
    id: "moby-dick",
    title: "Moby-Dick",
    author: "Herman Melville",
    difficulty: "Advanced",
    shortDescription:
      "Longer clauses and uncommon vocabulary sharpen precision under pressure.",
    passages: [
      {
        id: "md-1",
        label: "Call Me Ishmael",
        text:
          "Call me Ishmael. Some years ago, never mind how long precisely, having little or no money in my purse and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world."
      },
      {
        id: "md-2",
        label: "Sea Habit",
        text:
          "There now is your insular city of the Manhattoes, belted round by wharves as Indian isles by coral reefs, commerce surrounds it with her surf. Right and left, the streets take you waterward."
      },
      {
        id: "md-3",
        label: "Captain Ahab",
        text:
          "All visible objects, man, are but as pasteboard masks. If man will strike, strike through the mask. How can the prisoner reach outside except by thrusting through the wall?"
      },
      {
        id: "md-4",
        label: "Open Ocean",
        text:
          "The sea had jeeringly kept his finite body up, but drowned the infinite of his soul. Not drowned entirely, though. Rather carried down alive to wondrous depths, where strange shapes and shadows moved in silence."
      }
    ]
  }
];

export function getBookById(bookId: string): ClassicBook | undefined {
  return books.find((book) => book.id === bookId);
}
