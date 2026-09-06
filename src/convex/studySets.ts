import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const saveStudySet = internalMutation({
  args: {
    userId: v.string(),
    title: v.string(),
    sourceNotes: v.string(),
    sections: v.array(
      v.object({
        heading: v.string(),
        body: v.string(),
        keyTerms: v.array(
          v.object({ term: v.string(), definition: v.string() }),
        ),
      }),
    ),
    flashcards: v.array(v.object({ front: v.string(), back: v.string() })),
    quiz: v.array(
      v.object({
        question: v.string(),
        options: v.array(v.string()),
        correctIndex: v.number(),
        explanation: v.string(),
      }),
    ),
    matching: v.object({
      pairs: v.array(
        v.object({ term: v.string(), definition: v.string() }),
      ),
    }),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("studyMaterials", {
      userId: args.userId,
      title: args.title,
      sourceNotes: args.sourceNotes,
      sections: args.sections,
      flashcards: args.flashcards,
      quiz: args.quiz,
      matching: args.matching,
      createdAt: Date.now(),
    });
  },
});

export const listMyStudySets = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    if (userId === null) {
      return [];
    }

    return await ctx.db
      .query("studyMaterials")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const getStudySet = query({
  args: {
    setId: v.id("studyMaterials"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (userId === null) {
      return null;
    }

    const studySet = await ctx.db.get(args.setId);

    if (!studySet || studySet.userId !== userId) {
      return null;
    }

    return studySet;
  },
});
