// Shared study-kit types. Single source of truth for the AI-generated
// content stored on a material's `kit` field. Type-only (no runtime code),
// so both the Convex backend and the React frontend import from here.

export type GenerationStatus = "queued" | "generating" | "ready" | "error";

export type Accent = "lime" | "coral" | "blue";

/** The full AI-generated study kit for one material. */
export interface StudyKit {
  guide?: StudyGuide;
  flashcards?: Flashcard[];
  quiz?: QuizQuestion[];
  gamePairs?: GamePair[];
}

export interface StudyGuide {
  title?: string;
  /** 2-3 sentence plain-language intro. */
  summary: string;
  sections: {
    heading: string;
    body: string;
    bulletPoints?: string[];
  }[];
}

export interface Flashcard {
  /** Stable id, assigned at parse time ("card-0", ...). */
  id: string;
  front: string;
  back: string;
  /** Optional first-letter / context nudge. */
  hint?: string;
}

export interface QuizQuestion {
  /** Stable id, assigned at parse time ("q-0", ...). */
  id: string;
  question: string;
  /** Exactly 4 options. */
  options: string[];
  /** 0-based index of the correct option. */
  correctIndex: number;
  /** Short topic label, used for "review these next". */
  topic: string;
  explanation?: string;
}

export interface GamePair {
  /** Stable id, assigned at parse time ("pair-0", ...). */
  id: string;
  prompt: string;
  answer: string;
  hint?: string;
}

export type FlashcardStatus = "learning" | "gotit" | "retry";