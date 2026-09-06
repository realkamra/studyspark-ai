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