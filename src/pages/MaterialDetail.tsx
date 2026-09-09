import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, ArrowLeft, BookOpen, Brain, Check, Flame, Loader2, RefreshCw, Sparkles, Target, Video, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useAction, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import type { StudyKit, Flashcard } from "../types/study";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StudyGuideRenderer from "@/components/study/StudyGuideRenderer";
import FlashcardDeck from "@/components/study/FlashcardDeck";
import PracticeTest from "@/components/study/PracticeTest";
import MatchingGame from "@/components/study/MatchingGame";
import MemoryGame from "@/components/study/MemoryGame";
import FillInBlank from "@/components/study/FillInBlank";
import VideoSuggestions from "@/components/study/VideoSuggestions";
import KnowledgeRunner from "@/components/study/KnowledgeRunner";

const COOKING_STEPS = [
  "Reading your notes…",
  "Finding the big ideas…",
  "Writing your study guide…",
  "Making flashcards…",
  "Cooking up practice questions…",
  "Plating the review game…",
];

export default function MaterialDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const material = useQuery(api.materials.getMaterial, { materialId: id! as Id<"materials"> });
  const generate = useAction(api.ai.generate.generateStudyKit);
  const startedRef = useRef(false);
  const [retrying, setRetrying] = useState(false);

  // Kick off generation once when a pending material first appears.
  useEffect(() => {
    if (!material || startedRef.current) return;
    if (material.generationStatus === "queued" || material.generationStatus === "generating") {
      startedRef.current = true;
      void generate({ materialId: material._id });
    }
  }, [material, generate]);

  if (material === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4" role="status" aria-label="Loading material">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </span>
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Opening material</span>
        </div>
      </div>
    );
  }

  if (material === null) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-background px-5 text-center text-foreground">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/12 text-destructive">
          <AlertTriangle className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-[-0.04em]">This material is unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">It may have been removed or you may not have access.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="pressable rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Back to my materials
        </button>
      </div>
    );
  }

  const status = material.generationStatus;
  const kit = material.kit as StudyKit | undefined;

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto max-w-[1180px] px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="pressable inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-bold text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.8} /> My materials
        </button>

        {status === "queued" || status === "generating" ? (
          <CookingScreen title={material.title} />
        ) : status === "error" ? (
          <ErrorScreen
            title={material.title}
            message={material.errorMessage}
            retrying={retrying}
            onRetry={async () => {
              setRetrying(true);
              startedRef.current = true;
              try {
                await generate({ materialId: material._id });
              } finally {
                setRetrying(false);
              }
            }}
          />
        ) : (
          <>
            <header className="mt-10 border-b border-border pb-7 sm:mt-12">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                {material.sourceType === "file" ? "Uploaded file" : "Your notes"}
              </p>
              <h1 className="mt-3 max-w-[780px] text-4xl font-extrabold leading-[0.98] tracking-[-0.065em] sm:text-5xl">{material.title}</h1>
              <p className="mt-4 text-sm font-semibold text-muted-foreground">
                Your study kit is ready — study guide, flashcards, and more.
              </p>
            </header>

            <Tabs defaultValue="guide" className="mt-7">
              <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-lg border border-border bg-muted p-1 sm:w-fit" role="tablist" aria-label="Study modes">
                <TabsTrigger value="guide" className="pressable h-10 gap-2 rounded-md px-3 text-xs font-bold text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm" aria-controls="guide-panel" role="tab">
                  <BookOpen className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" /> Study guide
                </TabsTrigger>
                <TabsTrigger value="flashcards" className="pressable h-10 gap-2 rounded-md px-3 text-xs font-bold text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm" aria-controls="flashcards-panel" role="tab">
                  <Brain className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" /> Flashcards
                </TabsTrigger>
                <TabsTrigger value="practice" className="pressable h-10 gap-2 rounded-md px-3 text-xs font-bold text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm" aria-controls="practice-panel" role="tab">
                  <Flame className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" /> Practice test
                </TabsTrigger>
                <TabsTrigger value="games" className="pressable h-10 gap-2 rounded-md px-3 text-xs font-bold text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm" aria-controls="games-panel" role="tab">
                  <Target className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" /> Games
                </TabsTrigger>
                <TabsTrigger value="videos" className="pressable h-10 gap-2 rounded-md px-3 text-xs font-bold text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm" aria-controls="videos-panel" role="tab">
                  <Video className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" /> Videos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="guide" className="mt-7" id="guide-panel" role="tabpanel" aria-labelledby="guide-tab">
                {kit?.guide ? <StudyGuideRenderer guide={kit.guide} /> : <MissingKit note="study guide" />}
              </TabsContent>

              <TabsContent value="flashcards" className="mt-7" id="flashcards-panel" role="tabpanel" aria-labelledby="flashcards-tab">
                {kit?.flashcards && kit.flashcards.length > 0 ? (
                  <FlashcardDeck materialId={material._id} flashcards={kit.flashcards} />
                ) : (
                  <MissingKit note="flashcards" />
                )}
              </TabsContent>

              <TabsContent value="practice" className="mt-7" id="practice-panel" role="tabpanel" aria-labelledby="practice-tab">
                {kit?.quiz && kit.quiz.length > 0 ? (
                  <PracticeTest materialId={material._id} quiz={kit.quiz} />
                ) : (
                  <MissingKit note="practice test" />
                )}
              </TabsContent>

              <TabsContent value="games" className="mt-7" id="games-panel" role="tabpanel" aria-labelledby="games-tab">
                {kit?.gamePairs && kit.gamePairs.length > 0 ? (
                  <GamesSection kit={kit} flashcards={kit.flashcards || []} materialId={material._id} />
                ) : (
                  <MissingKit note="review games" />
                )}
              </TabsContent>

              <TabsContent value="videos" className="mt-7" id="videos-panel" role="tabpanel" aria-labelledby="videos-tab">
                {kit ? (
                  <VideoSuggestions kit={kit} materialTitle={material.title} />
                ) : (
                  <MissingKit note="video suggestions" />
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </main>
  );
}

function CookingScreen({ title }: { title: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <div className="mx-auto mt-16 max-w-[620px] rounded-2xl border border-border bg-card px-6 py-12 text-center sm:px-10 sm:py-16">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
        <motion.div
          animate={reduceMotion ? undefined : { rotate: 360 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 4, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="h-7 w-7 text-primary-foreground" />
        </motion.div>
      </div>
      <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">In progress</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.05em] sm:text-4xl">Cooking up your study kit</h1>
      <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-muted-foreground">
        Feeding <span className="font-bold text-foreground">{title}</span> to the AI chef. This usually takes 20–40 seconds — your guide, flashcards, test, and game are coming together.
      </p>
      <StepCarousel />
    </div>
  );
}

function StepCarousel() {
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % COOKING_STEPS.length), 2800);
    return () => clearInterval(timer);
  }, []);
  return (
    <motion.p
      key={index}
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      className="mx-auto mt-8 w-fit rounded-md border border-border bg-muted px-4 py-2 text-xs font-bold text-muted-foreground"
    >
      {COOKING_STEPS[index]}
    </motion.p>
  );
}

function ErrorScreen({ title, message, retrying, onRetry }: { title: string; message?: string; retrying?: boolean; onRetry: () => void }) {
  return (
    <div className="mx-auto mt-16 max-w-[620px] rounded-2xl border border-destructive/25 bg-card px-6 py-12 text-center sm:px-10">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/12 text-destructive">
        <AlertTriangle className="h-5 w-5" />
      </span>
      <p className="mt-7 text-[11px] font-bold uppercase tracking-[0.18em] text-destructive">Generation paused</p>
      <h1 className="mt-3 text-2xl font-extrabold tracking-[-0.04em]">The kit didn't come out right</h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
        We couldn't build a study kit for <span className="font-bold text-foreground">{title}</span>.
        {message ? <span className="mt-2 block font-bold text-foreground">{message}</span> : null}
      </p>
      <button
        type="button"
        onClick={onRetry}
        disabled={retrying}
        className="pressable mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {retrying ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        {retrying ? "Trying again..." : "Try again"}
      </button>
    </div>
  );
}

function MissingKit({ note }: { note: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-foreground">
        <BookOpen className="h-5 w-5" strokeWidth={1.8} />
      </span>
      <h2 className="mt-5 text-lg font-extrabold tracking-[-0.03em]">No {note} here yet</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">This part of the kit wasn't generated. Try regenerating the material.</p>
    </div>
  );
}

function GamesSection({ kit, flashcards, materialId }: { kit: StudyKit; flashcards: Flashcard[]; materialId: string }) {
  const [activeGame, setActiveGame] = useState<"matching" | "memory" | "fill" | "runner">("matching");

  return (
    <div className="space-y-6">
      {/* Game selector tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Game types">
        <button
          role="tab"
          aria-selected={activeGame === "matching"}
          aria-controls="matching-panel"
          id="matching-tab"
          onClick={() => setActiveGame("matching")}
          className={`pressable whitespace-nowrap flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
            activeGame === "matching"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          }`}
        >
          <Target className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          Matching
        </button>
        <button
          role="tab"
          aria-selected={activeGame === "memory"}
          aria-controls="memory-panel"
          id="memory-tab"
          onClick={() => setActiveGame("memory")}
          className={`pressable whitespace-nowrap flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
            activeGame === "memory"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          }`}
        >
          <Brain className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          Memory
        </button>
        <button
          role="tab"
          aria-selected={activeGame === "fill"}
          aria-controls="fill-panel"
          id="fill-tab"
          onClick={() => setActiveGame("fill")}
          className={`pressable whitespace-nowrap flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
            activeGame === "fill"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          }`}
        >
          <Check className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          Fill in Blank
        </button>
        <button
          role="tab"
          aria-selected={activeGame === "runner"}
          aria-controls="runner-panel"
          id="runner-tab"
          onClick={() => setActiveGame("runner")}
          className={`pressable whitespace-nowrap flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
            activeGame === "runner"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          }`}
        >
          <Zap className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          Runner
        </button>
      </div>

      {/* Game panels */}
      <div id="matching-panel" role="tabpanel" aria-labelledby="matching-tab" hidden={activeGame !== "matching"}>
        {kit.gamePairs && kit.gamePairs.length > 0 ? (
          <MatchingGame materialId={materialId} pairs={kit.gamePairs} />
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-foreground">
              <Target className="h-5 w-5" strokeWidth={2} />
            </span>
            <h2 className="mt-5 text-lg font-extrabold tracking-[-0.03em]">No matching game available</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Generate a study kit with game pairs to play matching.</p>
          </div>
        )}
      </div>

      <div id="memory-panel" role="tabpanel" aria-labelledby="memory-tab" hidden={activeGame !== "memory"}>
        {flashcards && flashcards.length > 0 ? (
          <MemoryGame materialId={materialId} flashcards={flashcards} />
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-foreground">
              <Brain className="h-5 w-5" strokeWidth={2} />
            </span>
            <h2 className="mt-5 text-lg font-extrabold tracking-[-0.03em]">No memory game available</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Generate a study kit with flashcards to play memory.</p>
          </div>
        )}
      </div>

      <div id="fill-panel" role="tabpanel" aria-labelledby="fill-tab" hidden={activeGame !== "fill"}>
        {kit ? (
          <FillInBlank materialId={materialId} kit={kit} />
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-foreground">
              <Check className="h-5 w-5" strokeWidth={2} />
            </span>
            <h2 className="mt-5 text-lg font-extrabold tracking-[-0.03em]">No fill-in-the-blank game available</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Generate a study kit to play fill in the blank.</p>
          </div>
        )}
      </div>

      <div id="runner-panel" role="tabpanel" aria-labelledby="runner-tab" hidden={activeGame !== "runner"}>
        {kit.quiz && kit.quiz.length > 0 ? (
          <KnowledgeRunner materialId={materialId as unknown as import("../convex/_generated/dataModel").Id<"materials">} quiz={kit.quiz} gamePairs={kit.gamePairs} />
        ) : kit.gamePairs && kit.gamePairs.length >= 3 ? (
          <KnowledgeRunner materialId={materialId as unknown as import("../convex/_generated/dataModel").Id<"materials">} quiz={[]} gamePairs={kit.gamePairs} />
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-foreground">
              <Zap className="h-5 w-5" strokeWidth={2} />
            </span>
            <h2 className="mt-5 text-lg font-extrabold tracking-[-0.03em]">Runner needs a study kit</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Generate your kit first — the runner turns your questions into a 3-lane dodge game.</p>
          </div>
        )}
      </div>
    </div>
  );
}