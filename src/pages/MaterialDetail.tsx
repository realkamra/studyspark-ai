import { motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, BookOpen, Brain, Flame, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { useAction, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import type { StudyKit } from "../types/study";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StudyGuideRenderer from "@/components/study/StudyGuideRenderer";
import FlashcardDeck from "@/components/study/FlashcardDeck";
import PracticeTest from "@/components/study/PracticeTest";

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

  // Loading state (query hasn't returned)
  if (material === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f8f5] text-[#17201d]">
        <Loader2 className="h-6 w-6 animate-spin text-[#87908a]" />
      </div>
    );
  }

  if (material === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f7f8f5] px-5 text-center text-[#17201d]">
        <AlertTriangle className="h-8 w-8 text-[#ef5f47]" />
        <h1 className="text-2xl font-extrabold">This one isn't yours (or it's gone).</h1>
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="rounded-xl bg-[#17201d] px-4 py-3 text-sm font-bold text-white"
        >
          Back to my materials
        </button>
      </div>
    );
  }

  const status = material.generationStatus;
  const kit = material.kit as StudyKit | undefined;

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#17201d]">
      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center gap-2 text-sm font-bold text-[#68736c] transition-colors hover:text-[#17201d]"
        >
          <ArrowLeft className="h-4 w-4" /> My materials
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
            <header className="mt-6">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#ef5f47]">
                {material.sourceType === "file" ? "Uploaded file" : "Your notes"}
              </p>
              <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">{material.title}</h1>
              <p className="mt-2 text-sm font-bold text-[#87908a]">
                Your study kit is ready — study guide, flashcards, and more.
              </p>
            </header>

            <Tabs defaultValue="guide" className="mt-8">
              <TabsList className="flex w-full flex-wrap justify-start gap-1 bg-white p-1 sm:w-fit">
                <TabsTrigger value="guide" className="gap-2">
                  <BookOpen className="h-4 w-4" /> Study guide
                </TabsTrigger>
                <TabsTrigger value="flashcards" className="gap-2">
                  <Brain className="h-4 w-4" /> Flashcards
                </TabsTrigger>
                <TabsTrigger value="practice" className="gap-2">
                  <Flame className="h-4 w-4" /> Practice test
                </TabsTrigger>
                <TabsTrigger value="play" className="gap-2" disabled>
                  <Flame className="h-4 w-4" /> Review game
                </TabsTrigger>
              </TabsList>

              <TabsContent value="guide" className="mt-6">
                {kit?.guide ? <StudyGuideRenderer guide={kit.guide} /> : <MissingKit note="study guide" />}
              </TabsContent>

              <TabsContent value="flashcards" className="mt-6">
                {kit?.flashcards && kit.flashcards.length > 0 ? (
                  <FlashcardDeck materialId={material._id} flashcards={kit.flashcards} />
                ) : (
                  <MissingKit note="flashcards" />
                )}
              </TabsContent>

              <TabsContent value="practice" className="mt-6">
                {kit?.quiz && kit.quiz.length > 0 ? (
                  <PracticeTest materialId={material._id} quiz={kit.quiz} />
                ) : (
                  <MissingKit note="practice test" />
                )}
              </TabsContent>

              <TabsContent value="play" className="mt-6">
                <ComingSoon
                  title="Review game — coming soon"
                  body="The fun part: match the terms and race the clock with your own material."
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </main>
  );
}

function CookingScreen({ title }: { title: string }) {
  return (
    <div className="mt-10 flex flex-col items-center px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-[26px] bg-[#17201d]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="h-9 w-9 text-[#d8f36a]" />
        </motion.div>
      </div>
      <h1 className="mt-7 text-3xl font-extrabold tracking-[-0.04em]">Cooking up your study kit</h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-[#68736c]">
        Feeding <span className="font-bold text-[#17201d]">{title}</span> to the AI chef. This usually
        takes 20–40 seconds — your guide, flashcards, test, and game are coming together.
      </p>
      <StepCarousel />
    </div>
  );
}

function StepCarousel() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % COOKING_STEPS.length), 2800);
    return () => clearInterval(timer);
  }, []);
  return (
    <motion.p
      key={index}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 rounded-full border border-[#17201d]/10 bg-white px-4 py-2 text-xs font-bold text-[#68736c]"
    >
      {COOKING_STEPS[index]}
    </motion.p>
  );
}

function ErrorScreen({ title, message, retrying, onRetry }: { title: string; message?: string; retrying?: boolean; onRetry: () => void }) {
  return (
    <div className="mt-10 flex flex-col items-center rounded-[26px] border border-[#17201d]/10 bg-white px-6 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ff967f]">
        <AlertTriangle className="h-6 w-6 text-[#17201d]" />
      </span>
      <h1 className="mt-5 text-2xl font-extrabold tracking-[-0.03em]">The kit didn't come out right</h1>
      <p className="mt-2 max-w-md text-sm leading-6 text-[#68736c]">
        We couldn't build a study kit for <span className="font-bold text-[#17201d]">{title}</span>.
        {message ? <span className="mt-2 block font-bold text-[#17201d]">{message}</span> : null}
      </p>
      <button
        type="button"
        onClick={onRetry}
        disabled={retrying}
        className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#17201d] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
      >
        {retrying ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        {retrying ? "Trying again..." : "Try again"}
      </button>
    </div>
  );
}

function MissingKit({ note }: { note: string }) {
  return (
    <div className="rounded-[22px] border border-dashed border-[#17201d]/20 bg-white px-6 py-12 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d8f36a]">
        <BookOpen className="h-5 w-5 text-[#17201d]" />
      </span>
      <h2 className="mt-4 text-lg font-extrabold">No {note} here yet</h2>
      <p className="mt-2 text-sm text-[#68736c]">This part of the kit wasn't generated. Try regenerating the material.</p>
    </div>
  );
}

function ComingSoon({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[22px] border border-dashed border-[#17201d]/20 bg-white px-6 py-14 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#9eb8ff]">
        <Flame className="h-6 w-6 text-[#17201d]" />
      </span>
      <h2 className="mt-4 text-xl font-extrabold">{title}</h2>
      <p className="mt-2 text-sm text-[#68736c]">{body}</p>
    </div>
  );
}