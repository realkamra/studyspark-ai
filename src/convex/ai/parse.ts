// Defensive parsing for the AI study-kit JSON.
//
// The LLM can return fences, leading prose, or subtly-wrong shapes, so we:
//   1. extract the first JSON object via brace matching (fence-proof),
//   2. normalize + validate every field by hand (no runtime schema lib),
//   3. assign stable ids (card-0, q-0, pair-0) used by study state tables.

import type { GamePair, QuizQuestion, StudyGuide, StudyKit } from "../../types/study";

interface ParseFailure {
  ok: false;
  error: string;
}
interface ParseSuccess {
  ok: true;
  kit: StudyKit;
}
export type ParseResult = ParseFailure | ParseSuccess;

/**
 * Brace-match the substring that starts at `start` (`{`) and ends at its
 * matching `}`, respecting string/escape state inside the JSON.
 */
function extractBalanced(text: string, start: number): string | null {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const char = text[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }
    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === "{") {
      depth++;
    } else if (char === "}") {
      depth--;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }
  return null;
}

/** Escape literal newlines/tabs that appear inside JSON string values. */
function escapeInStringControlChars(text: string): string {
  let out = "";
  let inString = false;
  let escaped = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inString) {
      if (escaped) {
        out += char;
        escaped = false;
      } else if (char === "\\") {
        out += char;
        escaped = true;
      } else if (char === "\n") {
        out += "\\n";
      } else if (char === "\r") {
        out += "\\r";
      } else if (char === "\t") {
        out += "\\t";
      } else if (char === '"') {
        out += char;
        inString = false;
      } else {
        out += char;
      }
      continue;
    }
    if (char === '"') {
      inString = true;
    }
    out += char;
  }
  return out;
}

/** Produce progressively-repaired candidates for one brace-balanced chunk. */
function repairJsonText(text: string): string[] {
  const candidates = [text];

  const noTrailingCommas = text.replace(/,\s*([}\]])/g, "$1");
  if (noTrailingCommas !== text) {
    candidates.push(noTrailingCommas);
  }

  const escapedControls = escapeInStringControlChars(text);
  if (escapedControls !== text) {
    candidates.push(escapedControls);
  }

  const both = escapeInStringControlChars(noTrailingCommas);
  if (both !== noTrailingCommas && both !== escapedControls) {
    candidates.push(both);
  }

  return candidates;
}

/**
 * Extract the JSON study-kit object from model output.
 *
 * LLMs frequently wrap JSON in fences or prose and make small JSON mistakes
 * (unescaped newlines in string values, trailing commas). Instead of giving up
 * on the first `{`, we walk every `{` as a potential start, brace-match each,
 * and try progressively-repaired candidates — preferring the object that
 * carries a `guide` key (the study kit always has one).
 */
export function extractJsonObject(text: string): Record<string, unknown> | null {
  let cleaned = text.trim();

  // Drop a leading ```json / ``` fence if present.
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "");
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3).trimEnd();
  }

  let fallback: Record<string, unknown> | null = null;

  for (let start = 0; start < cleaned.length; start++) {
    if (cleaned[start] !== "{") {
      continue;
    }
    const balanced = extractBalanced(cleaned, start);
    if (balanced === null) {
      continue;
    }
    for (const candidate of repairJsonText(balanced)) {
      try {
        const parsed = JSON.parse(candidate) as Record<string, unknown>;
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          if (!fallback) {
            fallback = parsed;
          }
          if (parsed.guide && typeof parsed.guide === "object") {
            return parsed;
          }
        }
      } catch {
        // Keep trying the remaining repair candidates / brace positions.
      }
    }
  }

  return fallback;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function asStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const out: string[] = [];
  for (const item of value) {
    if (!isNonEmptyString(item)) {
      return null;
    }
    out.push(item.trim());
  }
  return out.length > 0 ? out : null;
}

/** Validate + normalize the raw parsed object into a StudyKit. */
export function normalizeKit(raw: Record<string, unknown>): ParseResult {
  const kit: StudyKit = {};

  // ---- Study guide -------------------------------------------------------
  const guideRaw = raw.guide as Record<string, unknown> | undefined;
  if (guideRaw !== undefined && guideRaw !== null) {
    const summary = isNonEmptyString(guideRaw.summary) ? guideRaw.summary.trim() : null;
    const sectionsRaw = Array.isArray(guideRaw.sections) ? guideRaw.sections : [];
    const sections: StudyGuide["sections"] = [];

    for (const section of sectionsRaw as Record<string, unknown>[]) {
      const heading = isNonEmptyString(section.heading) ? section.heading.trim() : null;
      const body = isNonEmptyString(section.body) ? section.body.trim() : null;
      const bulletPoints = asStringArray(section.bulletPoints);
      if (!heading || !body) {
        continue;
      }
      sections.push({
        heading,
        body,
        bulletPoints: bulletPoints ?? undefined,
      });
    }

    if (summary && sections.length > 0) {
      kit.guide = {
        title: isNonEmptyString(guideRaw.title)
          ? (guideRaw.title as string).trim()
          : undefined,
        summary,
        sections,
      };
    }
  }

  // ---- Flashcards ---------------------------------------------------------
  if (Array.isArray(raw.flashcards)) {
    const flashcards: StudyKit["flashcards"] = [];
    for (const [index, card] of (raw.flashcards as Record<string, unknown>[]).entries()) {
      const front = isNonEmptyString(card.front) ? (card.front as string).trim() : null;
      const back = isNonEmptyString(card.back) ? (card.back as string).trim() : null;
      if (!front || !back) {
        continue;
      }
      flashcards.push({
        id: `card-${index}`,
        front,
        back,
        hint: isNonEmptyString(card.hint) ? (card.hint as string).trim() : undefined,
      });
    }
    if (flashcards.length >= 3) {
      kit.flashcards = flashcards;
    }
  }

  // ---- Practice test -------------------------------------------------------
  if (Array.isArray(raw.quiz)) {
    const quiz: QuizQuestion[] = [];
    for (const [index, question] of (raw.quiz as Record<string, unknown>[]).entries()) {
      const questionText = isNonEmptyString(question.question)
        ? (question.question as string).trim()
        : null;
      const options = asStringArray(question.options);
      const correctIndex = question.correctIndex;
      const topic = isNonEmptyString(question.topic) ? (question.topic as string).trim() : "General";
      if (
        !questionText ||
        !options ||
        options.length !== 4 ||
        typeof correctIndex !== "number" ||
        !Number.isInteger(correctIndex) ||
        correctIndex < 0 ||
        correctIndex > 3
      ) {
        continue;
      }
      quiz.push({
        id: `q-${index}`,
        question: questionText,
        options,
        correctIndex,
        topic,
        explanation: isNonEmptyString(question.explanation)
          ? (question.explanation as string).trim()
          : undefined,
      });
    }
    if (quiz.length >= 3) {
      kit.quiz = quiz;
    }
  }

  // ---- Game pairs ----------------------------------------------------------
  if (Array.isArray(raw.gamePairs)) {
    const gamePairs: GamePair[] = [];
    for (const [index, pair] of (raw.gamePairs as Record<string, unknown>[]).entries()) {
      const prompt = isNonEmptyString(pair.prompt) ? (pair.prompt as string).trim() : null;
      const answer = isNonEmptyString(pair.answer) ? (pair.answer as string).trim() : null;
      if (!prompt || !answer) {
        continue;
      }
      gamePairs.push({
        id: `pair-${index}`,
        prompt,
        answer,
        hint: isNonEmptyString(pair.hint) ? (pair.hint as string).trim() : undefined,
      });
    }
    if (gamePairs.length >= 3) {
      kit.gamePairs = gamePairs;
    }
  }

  // At least the guide must exist for the kit to be useful.
  if (!kit.guide) {
    return { ok: false, error: "The study guide was missing or unusable. Try again." };
  }

  return { ok: true, kit };
}

/** Full parse: extract JSON, then normalize/validate. */
export function parseStudyKit(content: string): ParseResult {
  const raw = extractJsonObject(content);
  if (!raw) {
    return { ok: false, error: "The AI response wasn't valid JSON. Try again." };
  }
  try {
    return normalizeKit(raw);
  } catch {
    return { ok: false, error: "The AI response couldn't be read. Try again." };
  }
}