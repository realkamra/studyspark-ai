"use node";

import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { vly } from "../lib/vly-integrations";

const GENERATION_PROMPT = `You are Notefox, a friendly study assistant that turns messy student notes into clear, memorable study materials.

Return ONLY valid JSON (no markdown, no code fences) matching this exact shape:
{
  "title": "A short, catchy title for this study set (max 6 words)",
  "sections": [
    { "heading": "Section heading", "body": "2-4 plain-language sentences explaining this part. Simple words, no jargon. Analogies welcome.", "keyTerms": [{ "term": "Term", "definition": "One-sentence definition a middle-schooler could understand." }] }
  ],
  "flashcards": [
    { "front": "A question or term", "back": "The clear answer or definition" }
  ],
  "quiz": [
    { "question": "A multiple-choice question", "options": ["A", "B", "C", "D"], "correctIndex": 0, "explanation": "One sentence on why this is right." }
  ],
  "matching": {
    "pairs": [
      { "term": "A key term", "definition": "Its short definition (max 12 words)" }
    ]
  }
}

Rules:
- 3 to 5 sections.
- 6 to 10 flashcards covering the most important ideas.
- 5 to 8 quiz questions with exactly 4 options each; correctIndex is the 0-based position of the correct option. Vary which position is correct.
- 6 to 8 matching pairs drawn from the most essential terms.
- Definitions must be short, friendly, and faithful to the notes.
- If the notes are too short or unclear, still do your best with what is there.`;

interface GeneratedMaterial {
  title: string;
  sections: Array<{
    heading: string;
    body: string;
    keyTerms: Array<{ term: string; definition: string }>;
  }>;
  flashcards: Array<{ front: string; back: string }>;
  quiz: Array<{
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>;
  matching: { pairs: Array<{ term: string; definition: string }> };
}

function extractJson(raw: string): GeneratedMaterial {
  // Strip accidental markdown fences and find the outermost JSON object.
  const cleaned = raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("The AI response did not contain valid JSON.");
  }

  return JSON.parse(cleaned.slice(start, end + 1)) as GeneratedMaterial;
}

export const generateStudyMaterials = action({
  args: {
    notes: v.string(),
  },
  handler: async (ctx, args): Promise<string> => {
    const userId = await getAuthUserId(ctx);

    if (userId === null) {
      throw new Error("You need to be signed in to create study materials.");
    }

    const trimmedNotes = args.notes.trim();

    if (trimmedNotes.length < 40) {
      throw new Error(
        "Add a bit more to your notes first — at least a few sentences.",
      );
    }

    const completion = await vly.ai.completion({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: GENERATION_PROMPT },
        {
          role: "user",
          content: `Here are my notes. Create the study materials:\n\n${trimmedNotes.slice(0, 12000)}`,
        },
      ],
      temperature: 0.4,
      maxTokens: 4000,
    });

    if (!completion.success || !completion.data) {
      throw new Error(
        completion.error
          ? `The AI service returned an error: ${completion.error}`
          : "The AI service returned an unknown error. Try again.",
      );
    }

    const content = completion.data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("The AI returned an empty response. Try again.");
    }

    const material = extractJson(content);

    if (
      !material.title ||
      !Array.isArray(material.sections) ||
      material.sections.length === 0 ||
      !Array.isArray(material.flashcards) ||
      !Array.isArray(material.quiz) ||
      !material.matching?.pairs
    ) {
      throw new Error(
        "The AI response was incomplete. Try generating again.",
      );
    }

    const studySetId: string = await ctx.runMutation(
      internal.studySets.saveStudySet,
      {
        userId,
        title: String(material.title).slice(0, 120),
        sourceNotes: trimmedNotes,
        sections: material.sections.map((section) => ({
          heading: String(section.heading ?? "Notes").slice(0, 160),
          body: String(section.body ?? ""),
          keyTerms: (section.keyTerms ?? []).map((term) => ({
            term: String(term?.term ?? "").slice(0, 120),
            definition: String(term?.definition ?? "").slice(0, 500),
          })),
        })),
        flashcards: material.flashcards.map((card) => ({
          front: String(card?.front ?? "").slice(0, 300),
          back: String(card?.back ?? "").slice(0, 600),
        })),
        quiz: material.quiz.map((question) => ({
          question: String(question?.question ?? "").slice(0, 400),
          options: (question?.options ?? []).map((option) =>
            String(option ?? "").slice(0, 200),
          ),
          correctIndex: Number.isInteger(question?.correctIndex)
            ? Math.max(0, Math.min(question.correctIndex, 3))
            : 0,
          explanation: String(question?.explanation ?? "").slice(0, 500),
        })),
        matching: {
          pairs: (material.matching.pairs ?? []).map((pair) => ({
            term: String(pair?.term ?? "").slice(0, 120),
            definition: String(pair?.definition ?? "").slice(0, 300),
          })),
        },
      },
    );

    return studySetId;
  },
});
