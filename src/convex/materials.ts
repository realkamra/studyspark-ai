import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
  MutationCtx,
  QueryCtx,
} from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import type { FlashcardStatus } from "../types/study";

/**
 * Get the current signed-in user document, or null when signed out.
 * Local fork of users.getCurrentUser (that file is read-only) that also
 * works for mutations: only uses getAuthUserId + ctx.db.get, so the same
 * signature accepts both QueryCtx and MutationCtx.
 */
async function getAuthUser(ctx: QueryCtx | MutationCtx): Promise<Doc<"users"> | null> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    return null;
  }
  return await ctx.db.get(userId);
}

const FEATURE_KEYS = ["guide", "flashcards", "quiz", "gamePairs"] as const;

/** Which parts of the study kit have content (for list cards & chips). */
function materialFeatures(kit: unknown): string[] {
  if (!kit || typeof kit !== "object") {
    return [];
  }
  const k = kit as Record<string, unknown>;
  return FEATURE_KEYS.filter((key) => {
    if (key === "guide") {
      return Boolean(k.guide);
    }
    return Array.isArray(k[key]) && (k[key] as unknown[]).length > 0;
  });
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/** The current user's materials, newest first. Returns light projections. */
export const listMaterials = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthUser(ctx);
    if (!user) {
      return [];
    }

    const docs = await ctx.db
      .query("materials")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    return docs.map((doc) => ({
      _id: doc._id,
      title: doc.title,
      accent: doc.accent ?? "sage",
      sourceType: doc.sourceType,
      generatedAt: doc.generatedAt,
      generationStatus: doc.generationStatus,
      features: materialFeatures(doc.kit),
    }));
  },
});

/** A single material with its full kit, ownership-checked. */
export const getMaterial = query({
  args: { materialId: v.id("materials") },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (!user) {
      return null;
    }

    const doc = await ctx.db.get(args.materialId);
    if (!doc || doc.userId !== user._id) {
      return null;
    }

    return doc;
  },
});

/** Per-card flashcard learning state for a material. */
export const getFlashcardStatus = query({
  args: { materialId: v.id("materials") },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (!user) {
      return {} as Record<string, FlashcardStatus>;
    }

    const rows = await ctx.db
      .query("studyProgress")
      .withIndex("by_user_material", (q) =>
        q.eq("userId", user._id).eq("materialId", args.materialId),
      )
      .collect();

    const byCard: Record<string, FlashcardStatus> = {};
    for (const row of rows) {
      byCard[row.cardId] = row.status;
    }
    return byCard;
  },
});

/** The last few quiz attempts for a material. */
export const getQuizAttempts = query({
  args: { materialId: v.id("materials") },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (!user) {
      return [];
    }

    const rows = await ctx.db
      .query("quizAttempts")
      .withIndex("by_user_material", (q) =>
        q.eq("userId", user._id).eq("materialId", args.materialId),
      )
      .order("desc")
      .take(5);

    return rows.map((row) => ({
      score: row.score,
      total: row.total,
      reviewTopics: row.reviewTopics,
      takenAt: row.takenAt,
    }));
  },
});

/** The last few game runs for a material. */
export const getGameRuns = query({
  args: { materialId: v.id("materials") },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (!user) {
      return [];
    }

    const rows = await ctx.db
      .query("gameRuns")
      .withIndex("by_user_material", (q) =>
        q.eq("userId", user._id).eq("materialId", args.materialId),
      )
      .order("desc")
      .take(8);

    return rows.map((row) => ({
      gameType: row.gameType,
      score: row.score,
      bestStreak: row.bestStreak,
      completedAt: row.completedAt,
    }));
  },
});

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

/** Create a material in "queued" state so the AI action can build its kit. */
export const createMaterial = mutation({
  args: {
    title: v.string(),
    sourceType: v.union(v.literal("text"), v.literal("file")),
    sourceText: v.optional(v.string()),
    sourceFileId: v.optional(v.id("_storage")),
    sourceFileName: v.optional(v.string()),
    accent: v.optional(v.union(v.literal("sage"), v.literal("coral"), v.literal("slate"), v.literal("mint"))),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (!user) {
      throw new ConvexError("Not authenticated");
    }

    const title = args.title.trim();
    const sourceText = args.sourceText?.trim();

    if (!title) {
      throw new ConvexError("Give your material a title");
    }
    if (args.sourceType === "text" && (!sourceText || sourceText.length < 8)) {
      throw new ConvexError("Paste at least a little bit of material to study");
    }
    if (args.sourceType === "file" && !args.sourceFileId) {
      throw new ConvexError("Upload a file to study from");
    }

    const id = await ctx.db.insert("materials", {
      userId: user._id,
      title,
      sourceType: args.sourceType,
      sourceText: sourceText || undefined,
      sourceFileId: args.sourceFileId,
      sourceFileName: args.sourceFileName,
      accent: args.accent ?? "sage",
      generationStatus: "queued",
    });

    return id;
  },
});

/** Transitions a material from "queued" to "generating" so duplicate calls are prevented. Internal. */
export const startGeneration = internalMutation({
  args: { materialId: v.id("materials") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.materialId);
    if (!doc) return;
    if (doc.generationStatus === "queued" || doc.generationStatus === "generating") {
      await ctx.db.patch(args.materialId, {
        generationStatus: "generating",
      });
    }
  },
});

/** Marks a material as ready once the AI kit has been written. Internal. */
export const finishGeneration = internalMutation({
  args: { materialId: v.id("materials"), kit: v.any() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.materialId, {
      kit: args.kit,
      generationStatus: "ready",
      generatedAt: Date.now(),
    });
  },
});

/** Marks a material as failed and stores why. Internal. */
export const failGeneration = internalMutation({
  args: { materialId: v.id("materials"), errorMessage: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.materialId, {
      generationStatus: "error",
      errorMessage: args.errorMessage,
    });
  },
});

/** Returns a URL the browser can POST a file to (Convex file storage). */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/** Record whether a flashcard was marked "got it", "still learning", or "retry". */
export const setFlashcardStatus = mutation({
  args: {
    materialId: v.id("materials"),
    cardId: v.string(),
    status: v.union(v.literal("learning"), v.literal("gotit"), v.literal("retry")),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (!user) {
      throw new ConvexError("Not authenticated");
    }
    const material = await ctx.db.get(args.materialId);
    if (!material || material.userId !== user._id) {
      throw new ConvexError("Material not found");
    }

    // read-then-write upsert (Convex has no native upsert)
    const existing = await ctx.db
      .query("studyProgress")
      .withIndex("by_user_material", (q) =>
        q.eq("userId", user._id).eq("materialId", args.materialId),
      )
      .filter((q) => q.eq(q.field("cardId"), args.cardId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        updatedAt: Date.now(),
      });
      return;
    }

    await ctx.db.insert("studyProgress", {
      userId: user._id,
      materialId: args.materialId,
      cardId: args.cardId,
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

/** Save the result of a completed practice test. */
export const recordQuizAttempt = mutation({
  args: {
    materialId: v.id("materials"),
    score: v.number(),
    total: v.number(),
    reviewTopics: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (!user) {
      throw new ConvexError("Not authenticated");
    }
    const material = await ctx.db.get(args.materialId);
    if (!material || material.userId !== user._id) {
      throw new ConvexError("Material not found");
    }

    await ctx.db.insert("quizAttempts", {
      userId: user._id,
      materialId: args.materialId,
      score: args.score,
      total: args.total,
      reviewTopics: args.reviewTopics,
      takenAt: Date.now(),
    });
  },
});

/** Save the result of a completed review game. */
export const recordGameRun = mutation({
  args: {
    materialId: v.id("materials"),
    gameType: v.union(v.literal("match"), v.literal("speed"), v.literal("sort")),
    score: v.number(),
    bestStreak: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (!user) {
      throw new ConvexError("Not authenticated");
    }
    const material = await ctx.db.get(args.materialId);
    if (!material || material.userId !== user._id) {
      throw new ConvexError("Material not found");
    }

    await ctx.db.insert("gameRuns", {
      userId: user._id,
      materialId: args.materialId,
      gameType: args.gameType,
      score: args.score,
      bestStreak: args.bestStreak,
      completedAt: Date.now(),
    });
  },
});

// ---------------------------------------------------------------------------
// Internal reads for the AI action (no auth - only callable server-side)
// ---------------------------------------------------------------------------

/** Fetch a material's source for generation. Internal. */
export const getMaterialForGeneration = internalQuery({
  args: { materialId: v.id("materials") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.materialId);
    if (!doc) {
      return null;
    }
    return {
      _id: doc._id,
      title: doc.title,
      sourceType: doc.sourceType,
      sourceText: doc.sourceText,
      sourceFileId: doc.sourceFileId,
    };
  },
});