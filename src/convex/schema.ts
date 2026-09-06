import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // a user's study material and the kit the AI generates from it
    materials: defineTable({
      userId: v.id("users"), // owner. do not remove
      title: v.string(), // display title of the material
      sourceType: v.union(v.literal("text"), v.literal("file")), // how the source was provided
      sourceText: v.optional(v.string()), // pasted text path
      sourceFileId: v.optional(v.id("_storage")), // uploaded file path
      sourceFileName: v.optional(v.string()),
      accent: v.optional(v.string()), // "lime" | "coral" | "blue"
      generationStatus: v.union(
        v.literal("queued"),
        v.literal("generating"),
        v.literal("ready"),
        v.literal("error"),
      ), // state of the AI study-kit generation
      errorMessage: v.optional(v.string()), // set when generation fails
      generatedAt: v.optional(v.number()), // epoch ms when the kit finished
      kit: v.optional(v.any()), // StudyKit JSON blob (typed via a cast in the action)
    }).index("by_userId", ["userId"]),

    // per-card flashcard learning state (got it / still learning / retry)
    studyProgress: defineTable({
      userId: v.id("users"),
      materialId: v.id("materials"),
      cardId: v.string(), // "card-0", ...
      status: v.union(v.literal("learning"), v.literal("gotit"), v.literal("retry")),
      updatedAt: v.number(),
    }).index("by_user_material", ["userId", "materialId"]),

    // full study kits, ready for the AI action to write to
    quizAttempts: defineTable({
      userId: v.id("users"),
      materialId: v.id("materials"),
      score: v.number(),
      total: v.number(),
      reviewTopics: v.array(v.string()),
      takenAt: v.number(),
    }).index("by_user_material", ["userId", "materialId"]),

    // game runs, so best scores/streaks persist per material
    gameRuns: defineTable({
      userId: v.id("users"),
      materialId: v.id("materials"),
      gameType: v.union(v.literal("match"), v.literal("speed"), v.literal("sort")),
      score: v.number(),
      bestStreak: v.number(),
      completedAt: v.number(),
    }).index("by_user_material", ["userId", "materialId"]),

    // add other tables here

    // tableName: defineTable({
    //   ...
    //   // table fields
    // }).index("by_field", ["field"])

    studyMaterials: defineTable({
      userId: v.string(),
      title: v.string(),
      sourceNotes: v.string(),
      sections: v.array(
        v.object({
          heading: v.string(),
          body: v.string(),
          keyTerms: v.array(
            v.object({
              term: v.string(),
              definition: v.string(),
            }),
          ),
        }),
      ),
      flashcards: v.array(
        v.object({
          front: v.string(),
          back: v.string(),
        }),
      ),
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
          v.object({
            term: v.string(),
            definition: v.string(),
          }),
        ),
      }),
      createdAt: v.number(),
    }).index("by_user", ["userId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
