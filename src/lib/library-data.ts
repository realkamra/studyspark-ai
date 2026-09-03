export type LearningFormat = "Guide" | "Video" | "Flashcards";

export interface LearningItem {
  id: string;
  title: string;
  category: string;
  description: string;
  format: LearningFormat;
  duration: string;
  accent: "lime" | "coral" | "blue";
  publishedBy: string;
  isOwned?: boolean;
  sourceName?: string;
}

export const libraryItems: LearningItem[] = [
  {
    id: "feedback-loops",
    title: "Feedback loops without the fog",
    category: "Work & business",
    description: "A visual introduction to how small signals become better decisions, better products, and better teams.",
    format: "Guide",
    duration: "7 min read",
    accent: "lime",
    publishedBy: "Notefox editorial",
  },
  {
    id: "photosynthesis",
    title: "Photosynthesis, but chill",
    category: "Science",
    description: "See how plants turn sunlight into food through a tiny, surprisingly efficient energy system.",
    format: "Video",
    duration: "4 min watch",
    accent: "blue",
    publishedBy: "Notefox editorial",
  },
  {
    id: "design-principles",
    title: "The design principles cheat sheet",
    category: "Creative work",
    description: "A quick visual reference for hierarchy, contrast, spacing, and the other things that make ideas easier to see.",
    format: "Flashcards",
    duration: "12 cards",
    accent: "coral",
    publishedBy: "Notefox editorial",
  },
  {
    id: "customer-journey",
    title: "Customer journeys in plain English",
    category: "Work & business",
    description: "Map what customers need, feel, and do from first hello to loyal fan without the strategy-speak.",
    format: "Guide",
    duration: "6 min read",
    accent: "coral",
    publishedBy: "Notefox editorial",
  },
  {
    id: "memory-basics",
    title: "How memory actually sticks",
    category: "Mind & learning",
    description: "A friendly tour of recall, spacing, and why rereading the same paragraph is not a personality trait.",
    format: "Video",
    duration: "5 min watch",
    accent: "lime",
    publishedBy: "Notefox editorial",
  },
  {
    id: "data-storytelling",
    title: "Tell a better story with data",
    category: "Creative work",
    description: "Turn a spreadsheet full of numbers into a clear point of view people can act on.",
    format: "Flashcards",
    duration: "10 cards",
    accent: "blue",
    publishedBy: "Notefox editorial",
  },
];

const uploadedItemsKey = "notefox-uploaded-items";

export function getUploadedItems(): LearningItem[] {
  if (typeof window === "undefined") return [];

  try {
    const storedItems = window.localStorage.getItem(uploadedItemsKey);
    return storedItems ? (JSON.parse(storedItems) as LearningItem[]) : [];
  } catch {
    return [];
  }
}

export function saveUploadedItem(item: LearningItem) {
  if (typeof window === "undefined") return;

  const items = getUploadedItems();
  window.localStorage.setItem(uploadedItemsKey, JSON.stringify([item, ...items]));
}

export function getAllLibraryItems() {
  return [...getUploadedItems(), ...libraryItems];
}
