import type { LiteraryWork } from "@/types/literaryMapping";

export const builtInLiteraryWorks: LiteraryWork[] = [
  {
    id: "dream-red-chamber",
    title: "Dream of the Red Chamber",
    author: "Cao Xueqin",
    language: "zh",
    tradition: "Chinese classic",
    publicationNote: "Qing dynasty novel; public-domain Chinese text from Project Gutenberg.",
    sourceNote: "Full traditional Chinese text is stored locally at /books/dream-of-the-red-chamber-zh.txt.",
    fullTextUrl: "/books/dream-of-the-red-chamber-zh.txt",
    passages: [
      {
        id: "dream-red-chamber-placeholder",
        label: "Full text not loaded",
        chapter: "Project Gutenberg",
        text:
          "Click Load full text to import the complete Chinese Project Gutenberg text of 紅樓夢 into the reader workspace.",
      },
    ],
  },
  {
    id: "journey-west",
    title: "Journey to the West",
    author: "Wu Cheng'en",
    language: "zh",
    tradition: "Chinese classic",
    publicationNote: "Ming dynasty novel; public-domain Chinese text from Project Gutenberg.",
    sourceNote: "Full traditional Chinese text is stored locally at /books/journey-to-the-west-zh.txt.",
    fullTextUrl: "/books/journey-to-the-west-zh.txt",
    passages: [
      {
        id: "journey-west-placeholder",
        label: "Full text not loaded",
        chapter: "Project Gutenberg",
        text:
          "Click Load full text to import the complete Chinese Project Gutenberg text of 西遊記 into the reader workspace.",
      },
    ],
  },
  {
    id: "hamlet",
    title: "Hamlet",
    author: "William Shakespeare",
    language: "en",
    tradition: "World classic",
    publicationNote: "Public-domain English play from Project Gutenberg.",
    sourceNote: "Full English text is stored locally at /books/hamlet.txt.",
    fullTextUrl: "/books/hamlet.txt",
    passages: [
      {
        id: "hamlet-placeholder",
        label: "Full text not loaded",
        chapter: "Project Gutenberg",
        text:
          "Click Load full text to import the complete Project Gutenberg text of Hamlet into the reader workspace.",
      },
    ],
  },
  {
    id: "great-gatsby",
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    language: "en",
    tradition: "World classic",
    publicationNote: "Public-domain English novel from Project Gutenberg.",
    sourceNote: "Full English text is stored locally at /books/the-great-gatsby.txt.",
    fullTextUrl: "/books/the-great-gatsby.txt",
    passages: [
      {
        id: "gatsby-placeholder",
        label: "Full text not loaded",
        chapter: "Project Gutenberg",
        text:
          "Click Load full text to import the complete Project Gutenberg text of The Great Gatsby into the reader workspace.",
      },
    ],
  },
  {
    id: "pride-and-prejudice-full",
    title: "Pride and Prejudice",
    author: "Jane Austen",
    language: "en",
    tradition: "World classic",
    publicationNote: "Public-domain novel from Project Gutenberg.",
    sourceNote: "Full text is stored locally at /books/pride-and-prejudice.txt and can be loaded into chapters.",
    fullTextUrl: "/books/pride-and-prejudice.txt",
    passages: [
      {
        id: "pride-placeholder",
        label: "Full text not loaded",
        chapter: "Project Gutenberg",
        text:
          "Click Load full text to import the complete Project Gutenberg text of Pride and Prejudice into the reader workspace.",
      },
    ],
  },
];
