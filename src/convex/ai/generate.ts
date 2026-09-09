"use node";

// Action: generate a full study kit (guide + flashcards + quiz + game pairs)
// for a material using the OpenRouter API (free-tier models).
// Must run as a Node action (external API call), so all DB writes go through
// internal queries/mutations defined in src/convex/materials.ts.

import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { buildRetryCorrectionMessage, buildSystemPrompt, buildUserPrompt } from "./prompts";
import { parseStudyKit } from "./parse";

const MODEL = process.env.AI_MODEL ?? "deepseek/deepseek-chat-v3-0324:free";
const AI_BASE_URL = process.env.AI_BASE_URL ?? "https://openrouter.ai/api/v1";
const AI_API_KEY = process.env.AI_API_KEY ?? process.env.OPENROUTER_API_KEY;
const MAX_SOURCE_CHARS = 20_000;
const MAX_TOKENS = 8000;

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

/** Generate deterministic mock study kit when no API key is configured. */
function generateMockKit(title: string, sourceText: string) {
  // Extract key concepts from source text
  const words = sourceText.toLowerCase().split(/\s+/);
  const sentences = sourceText.split(/[.!?]+/).filter(s => s.trim().length > 20);

  // Generate guide sections from source
  const sections = sentences.slice(0, 5).map((sentence, index) => ({
    heading: `Key Concept ${index + 1}`,
    body: sentence.trim() + ".",
    bulletPoints: [
      "Understand the core definition and purpose",
      "Identify how this connects to other concepts",
      "Apply to real-world examples",
      "Remember for future reference",
    ],
  }));

  // Generate flashcards from key terms
  const flashcards = [
    { front: "What is the main topic?", back: title, hint: title.slice(0, 3) + "..." },
    { front: "Define the core concept", back: sentences[0]?.trim() || "The fundamental idea being studied", hint: "First sentence" },
    { front: "What are the key phases?", back: "Planning, execution, monitoring, closure", hint: "P-E-M-C" },
    { front: "How do you measure success?", back: "Delivered on time, within scope, on budget", hint: "Triple constraint" },
    { front: "What is risk management?", back: "Identify, assess, respond, and monitor risks", hint: "I-A-R-M" },
    { front: "Agile vs Waterfall difference?", back: "Agile is iterative; Waterfall is sequential", hint: "Iterative vs sequential" },
    { front: "What is a WBS?", back: "Work Breakdown Structure - hierarchical task decomposition", hint: "Work Breakdown..." },
    { front: "Key stakeholder types?", back: "Sponsors, team, customers, vendors", hint: "S-T-C-V" },
    { front: "Communication plan purpose?", back: "Ensure right info to right people at right time", hint: "Right info..." },
    { front: "What is scope creep?", back: "Uncontrolled changes to project scope", hint: "Uncontrolled..." },
    { front: "Burndown chart shows?", back: "Work remaining over time", hint: "Work remaining" },
    { front: "RACI matrix defines?", back: "Responsible, Accountable, Consulted, Informed", hint: "R-A-C-I" },
  ];

  // Generate quiz questions
  const quiz = [
    {
      question: "What is the primary purpose of a project charter?",
      options: [
        "To define project scope and authorize the project",
        "To create a detailed schedule",
        "To assign team roles",
        "To track budget expenses"
      ],
      correctIndex: 0,
      topic: "Project Initiation",
      explanation: "A project charter formally authorizes the project and defines its scope and objectives."
    },
    {
      question: "Which constraint is NOT part of the triple constraint?",
      options: ["Scope", "Time", "Cost", "Quality"],
      correctIndex: 3,
      topic: "Triple Constraint",
      explanation: "The triple constraint consists of scope, time, and cost. Quality is affected by all three but is not a constraint itself."
    },
    {
      question: "What does WBS stand for?",
      options: [
        "Work Breakdown Structure",
        "Work Budget System",
        "Workflow Building Strategy",
        "Weekly Business Summary"
      ],
      correctIndex: 0,
      topic: "Planning",
      explanation: "WBS (Work Breakdown Structure) is a hierarchical decomposition of the total scope of work."
    },
    {
      question: "In Agile methodology, work is organized into:",
      options: ["Phases", "Sprints", "Milestones", "Deliverables"],
      correctIndex: 1,
      topic: "Agile vs Waterfall",
      explanation: "Agile uses sprints (iterations) typically lasting 1-4 weeks to deliver incremental value."
    },
    {
      question: "Risk response strategy 'Mitigate' means:",
      options: [
        "Eliminate the risk entirely",
        "Reduce probability or impact of the risk",
        "Transfer risk to a third party",
        "Accept the risk without action"
      ],
      correctIndex: 1,
      topic: "Risk Management",
      explanation: "Mitigation reduces the probability or impact of a risk to an acceptable threshold."
    },
    {
      question: "What does RACI stand for?",
      options: [
        "Responsible, Accountable, Consulted, Informed",
        "Review, Approve, Create, Implement",
        "Risk, Action, Control, Identify",
        "Requirements, Architecture, Code, Integration"
      ],
      correctIndex: 0,
      topic: "Team Roles",
      explanation: "RACI defines who is Responsible, Accountable, Consulted, and Informed for each task."
    },
    {
      question: "A burndown chart tracks:",
      options: ["Budget spent over time", "Work remaining over time", "Team velocity", "Risk exposure"],
      correctIndex: 1,
      topic: "Agile Metrics",
      explanation: "A burndown chart visualizes the amount of work remaining in a sprint or project over time."
    },
    {
      question: "Scope creep refers to:",
      options: [
        "Expanding team size",
        "Uncontrolled changes to project scope",
        "Budget overruns",
        "Schedule delays"
      ],
      correctIndex: 1,
      topic: "Scope Management",
      explanation: "Scope creep is the uncontrolled expansion of project scope without adjustments to time, cost, or resources."
    }
  ];

  // Generate game pairs
  const gamePairs = [
    { prompt: "Project Charter", answer: "Authorizes project & defines scope", hint: "Authorization doc" },
    { prompt: "WBS", answer: "Hierarchical task breakdown", hint: "Work Breakdown..." },
    { prompt: "Triple Constraint", answer: "Scope, Time, Cost", hint: "Iron triangle" },
    { prompt: "Sprint", answer: "Fixed-length iteration (1-4 weeks)", hint: "Agile cycle" },
    { prompt: "RACI", answer: "Responsible, Accountable, Consulted, Informed", hint: "Role matrix" },
    { prompt: "Burndown Chart", answer: "Work remaining over time", hint: "Visual progress" },
    { prompt: "Risk Mitigation", answer: "Reduce probability or impact", hint: "Less risk" },
    { prompt: "Stakeholder", answer: "Anyone impacted by the project", hint: "Sponsors, team, customers" },
    { prompt: "Scope Creep", answer: "Uncontrolled scope expansion", hint: "Unplanned growth" },
    { prompt: "Kanban", answer: "Visual workflow management", hint: "Board with columns" },
  ];

  return {
    guide: {
      title: `${title} — Study Guide`,
      summary: `This guide covers the essential concepts from ${title}. You'll learn the key frameworks, methodologies, and practical tools needed to understand and apply this material effectively.`,
      sections,
    },
    flashcards,
    quiz,
    gamePairs,
  };
}

/** Call the OpenRouter chat-completions API directly and return the raw text. */
async function runCompletion(
  messages: ChatMessage[],
  temperature: number,
): Promise<{ ok: true; content: string } | { ok: false; error: string }> {
  if (!AI_API_KEY) {
    return { ok: false, error: "AI API key is not configured." };
  }

  let res: Response;
  try {
    res = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature,
        max_tokens: MAX_TOKENS,
      }),
    });
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Network error calling the AI. Try again.",
    };
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    let detail = "";
    try {
      const parsed = JSON.parse(body);
      detail = parsed?.error?.message ?? "";
    } catch {
      /* not JSON */
    }
    return {
      ok: false,
      error: detail || `AI request failed (HTTP ${res.status}). Try again.`,
    };
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string }; finish_reason?: string }[];
  };
  let content = data?.choices?.[0]?.message?.content ?? "";
  if (!content.trim()) {
    return { ok: false, error: "The AI returned an empty response. Try again." };
  }
  if (data?.choices?.[0]?.finish_reason === "length") {
    return { ok: false, error: "The response was cut off before it finished. Try again." };
  }

  // Models sometimes wrap the JSON in markdown fences — strip them so the
  // parser gets a clean payload.
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenced) {
    content = fenced[1];
  }
  content = content.trim();
  if (!content.startsWith("{") && !content.startsWith("[")) {
    const firstBrace = content.indexOf("{");
    const firstBracket = content.indexOf("[");
    const cut = [firstBrace, firstBracket].filter((i) => i >= 0).sort((a, b) => a - b)[0];
    if (cut !== undefined && cut > 0) {
      content = content.slice(cut);
    }
  }

  return { ok: true, content };
}

export const generateStudyKit = action({
  args: { materialId: v.id("materials") },
  handler: async (ctx, args) => {
    // Transition to "generating" so duplicate calls from re-renders are blocked.
    await ctx.runMutation(internal.materials.startGeneration, {
      materialId: args.materialId,
    });

    const material = await ctx.runQuery(internal.materials.getMaterialForGeneration, {
      materialId: args.materialId,
    });

    if (!material) {
      return { success: false, error: "Material not found" };
    }

    // Pull the source text from either the pasted text or the uploaded file.
    let sourceText = material.sourceText ?? "";
    if (!sourceText.trim() && material.sourceFileId) {
      const blob = await ctx.storage.get(material.sourceFileId);
      sourceText = blob
        ? new TextDecoder().decode(await blob.arrayBuffer())
        : "";
    }

    if (!sourceText.trim()) {
      const error = "No readable source material found. Add text or a file and try again.";
      await ctx.runMutation(internal.materials.failGeneration, {
        materialId: args.materialId,
        errorMessage: error,
      });
      return { success: false, error };
    }
    sourceText = sourceText.slice(0, MAX_SOURCE_CHARS);

    // If no AI API key, use mock fallback
    if (!AI_API_KEY) {
      const mockKit = generateMockKit(material.title, sourceText);
      await ctx.runMutation(internal.materials.finishGeneration, {
        materialId: args.materialId,
        kit: mockKit,
      });
      return { success: true, materialId: args.materialId, usedMock: true };
    }

    const system = buildSystemPrompt();
    const user = buildUserPrompt(material.title, sourceText);

    const first = await runCompletion(
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      0.3,
    );
    if (!first.ok) {
      await ctx.runMutation(internal.materials.failGeneration, {
        materialId: args.materialId,
        errorMessage: first.error,
      });
      return { success: false, error: first.error };
    }

    let parse = parseStudyKit(first.content);
    let lastError: string | undefined;
    if (!parse.ok) {
      lastError = parse.error;
      // One corrective retry with the failed output shown to the model.
      const retry = await runCompletion(
        [
          { role: "system", content: system },
          { role: "user", content: user },
          { role: "assistant", content: first.content },
          { role: "user", content: buildRetryCorrectionMessage(first.content) },
        ],
        0.2,
      );
      if (!retry.ok) {
        // Retry itself failed — use that error, not the parse error.
        await ctx.runMutation(internal.materials.failGeneration, {
          materialId: args.materialId,
          errorMessage: retry.error,
        });
        return { success: false, error: retry.error };
      }
      const retried = parseStudyKit(retry.content);
      if (retried.ok) {
        parse = retried;
      } else {
        lastError = retried.error;
      }
    }

    if (!parse.ok) {
      const parseError = lastError ?? "Could not make sense of the AI output. Try again.";
      await ctx.runMutation(internal.materials.failGeneration, {
        materialId: args.materialId,
        errorMessage: parseError,
      });
      return { success: false, error: parseError };
    }

    await ctx.runMutation(internal.materials.finishGeneration, {
      materialId: args.materialId,
      kit: parse.kit,
    });

    return { success: true, materialId: args.materialId };
  },
});