"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, Loader2, RefreshCw, Sparkles, Target, Trophy } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GamePair } from "../../types/study";

interface Props {
  materialId: string;
  pairs: GamePair[];
}

const CARD_SIZE = 14; // rem units for card height

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function MatchingGame({ materialId, pairs: originalPairs }: Props) {
  const reduceMotion = useReducedMotion();
  const [pairs, setPairs] = useState<Array<{ id: string; text: string; type: "prompt" | "answer" }>>([]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set());
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const startTimeRef = useRef<number>(Date.now());

  // Initialize game with shuffled pairs
  useEffect(() => {
    if (originalPairs.length === 0) return;

    // Create shuffled left (prompts) and right (answers) arrays
    const leftItems = shuffleArray(originalPairs.map((p) => ({ id: p.id, text: p.prompt, type: "prompt" as const })));
    const rightItems = shuffleArray(originalPairs.map((p) => ({ id: p.id, text: p.answer, type: "answer" as const })));

    setPairs([
      ...leftItems,
      ...rightItems,
    ]);
    setMatchedPairs(new Set());
    setScore(0);
    setStreak(0);
    setGameComplete(false);
    setShowCelebration(false);
    startTimeRef.current = Date.now();
    setAnnouncement("Match the terms with their definitions. Select one from each column.");
  }, [originalPairs]);

  const handleSelect = useCallback((id: string, type: "prompt" | "answer") => {
    if (type === "prompt") {
      if (selectedLeft === id) {
        setSelectedLeft(null);
        return;
      }
      setSelectedLeft(id);

      // Auto-match if right is already selected
      if (selectedRight) {
        checkMatch(id, selectedRight);
      }
    } else {
      if (selectedRight === id) {
        setSelectedRight(null);
        return;
      }
      setSelectedRight(id);

      // Auto-match if left is already selected
      if (selectedLeft) {
        checkMatch(selectedLeft, id);
      }
    }
  }, [selectedLeft, selectedRight]);

  const checkMatch = useCallback((leftId: string, rightId: string) => {
    const leftPair = originalPairs.find((p) => p.id === leftId);
    const rightPair = originalPairs.find((p) => p.id === rightId);

    const isMatch = leftPair && rightPair && leftPair.id === rightPair.id;

    if (isMatch) {
      // Correct match
      setMatchedPairs((prev) => new Set([...prev, leftId]));
      setSelectedLeft(null);
      setSelectedRight(null);

      const newStreak = streak + 1;
      setStreak(newStreak);
      setBestStreak((prev) => Math.max(prev, newStreak));

      const points = 100 + newStreak * 20;
      setScore((prev) => prev + points);

      setAnnouncement(`Correct! "${leftPair.prompt}" matches "${leftPair.answer}". +${points} points`);

      // Check if game complete
      if (matchedPairs.size + 1 === originalPairs.length) {
        setTimeout(() => {
          setGameComplete(true);
          setShowCelebration(true);
          const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);
          setAnnouncement(`Game complete! Score: ${score + points} | Time: ${timeTaken}s | Best streak: ${Math.max(bestStreak, newStreak)}`);
        }, 500);
      }
    } else {
      // Incorrect match
      setStreak(0);
      setAnnouncement(`Not a match. "${leftPair?.prompt}" doesn't match "${rightPair?.answer}". Try again.`);
      setTimeout(() => {
        setSelectedLeft(null);
        setSelectedRight(null);
      }, reduceMotion ? 100 : 800);
    }
  }, [originalPairs, streak, matchedPairs.size, score, bestStreak, reduceMotion]);

  const handleReset = useCallback(() => {
    setPairs((prev) => shuffleArray(prev));
    setMatchedPairs(new Set());
    setScore(0);
    setStreak(0);
    setGameComplete(false);
    setShowCelebration(false);
    setAnnouncement("Match the terms with their definitions. Select one from each column.");
    startTimeRef.current = Date.now();
  }, []);

  const prompts = pairs.filter((p) => p.type === "prompt");
  const answers = pairs.filter((p) => p.type === "answer");

  const isMatched = (id: string) => matchedPairs.has(id);
  const isSelected = (id: string, type: "prompt" | "answer") =>
    (type === "prompt" && selectedLeft === id) || (type === "answer" && selectedRight === id);

  return (
    <div className="mx-auto max-w-4xl" role="region" aria-label="Matching Game" aria-live="polite">
      {/* Header with stats */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        style={{ animationDuration: reduceMotion ? "0.01ms" : "300ms" }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Target className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-xl font-semibold text-navy-ink">Matching Game</h2>
            <p className="text-sm text-slate-600">Match each term with its correct definition</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-4 py-2">
            <Trophy className="h-4 w-4 text-amber-500" aria-hidden="true" />
            <span className="font-mono text-lg font-semibold text-navy-ink">{score}</span>
            <span className="text-xs text-slate-500">points</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-4 py-2">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
            <span className="font-mono text-lg font-semibold text-navy-ink">{streak}</span>
            <span className="text-xs text-slate-500">streak</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-4 py-2">
            <Target className="h-4 w-4 text-green-500" aria-hidden="true" />
            <span className="font-mono text-lg font-semibold text-navy-ink">{matchedPairs.size} / {originalPairs.length}</span>
            <span className="text-xs text-slate-500">matched</span>
          </div>
        </div>
      </motion.div>

      {/* Announcement area */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      <div className="mb-4 text-center text-sm text-slate-600 min-h-[2.5rem]" aria-live="polite">
        {announcement}
      </div>

      {/* Game grid */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        style={{ animationDuration: reduceMotion ? "0.01ms" : "400ms" }}
        className="grid gap-4 lg:grid-cols-2"
      >
        {/* Left column - Prompts */}
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Terms</h3>
            <span className="text-xs text-slate-400">{prompts.length} items</span>
          </div>
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            }}
            role="list"
            aria-label="Terms to match"
          >
            {prompts.map((item, index) => (
              <motion.button
                key={item.id}
                onClick={() => !isMatched(item.id) && handleSelect(item.id, "prompt")}
                disabled={isMatched(item.id) || gameComplete}
                initial={reduceMotion ? false : { opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.03, ease: [0.23, 1, 0.32, 1] }}
                style={{ animationDuration: reduceMotion ? "0.01ms" : "300ms" }}
                // Hover and press states handled via hover-lift and pressable classes
                className={`
                  pressable relative h-[${CARD_SIZE}rem] rounded-xl border-2 p-4 text-left
                  transition-[border-color,background-color,color,box-shadow,transform] duration-[var(--duration-normal)] ease-[var(--ease-out)]
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                  ${isMatched(item.id)
                    ? "bg-green-50 border-green-300 text-green-800 cursor-default"
                    : isSelected(item.id, "prompt")
                    ? "bg-primary/10 border-primary text-navy-ink"
                    : "bg-white border-slate-200 text-navy-ink hover:border-primary/50 hover:shadow-md"
                  }
                `}
                role="listitem"
                aria-selected={isSelected(item.id, "prompt")}
                aria-pressed={isSelected(item.id, "prompt")}
                aria-disabled={isMatched(item.id) || gameComplete}
              >
                <span className="font-medium leading-relaxed">{item.text}</span>
                {isMatched(item.id) && (
                  <motion.span
                    initial={reduceMotion ? false : { scale: 0.92, opacity: 0, rotate: -180 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white"
                    aria-hidden="true"
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </motion.span>
                )}
                {isSelected(item.id, "prompt") && !isMatched(item.id) && (
                  <motion.div
                    initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute bottom-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white"
                    aria-hidden="true"
                  >
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Right column - Answers */}
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Definitions</h3>
            <span className="text-xs text-slate-400">{answers.length} items</span>
          </div>
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            }}
            role="list"
            aria-label="Definitions to match"
          >
            {answers.map((item, index) => (
              <motion.button
                key={item.id}
                onClick={() => !isMatched(item.id) && handleSelect(item.id, "answer")}
                disabled={isMatched(item.id) || gameComplete}
                initial={reduceMotion ? false : { opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.03, ease: [0.23, 1, 0.32, 1] }}
                style={{ animationDuration: reduceMotion ? "0.01ms" : "300ms" }}
                // Hover and press states handled via hover-lift and pressable classes
                className={`
                  pressable relative h-[${CARD_SIZE}rem] rounded-xl border-2 p-4 text-left
                  transition-[border-color,background-color,color,box-shadow,transform] duration-[var(--duration-normal)] ease-[var(--ease-out)]
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                  ${isMatched(item.id)
                    ? "bg-green-50 border-green-300 text-green-800 cursor-default"
                    : isSelected(item.id, "answer")
                    ? "bg-primary/10 border-primary text-navy-ink"
                    : "bg-white border-slate-200 text-navy-ink hover:border-primary/50 hover:shadow-md"
                  }
                `}
                role="listitem"
                aria-selected={isSelected(item.id, "answer")}
                aria-pressed={isSelected(item.id, "answer")}
                aria-disabled={isMatched(item.id) || gameComplete}
              >
                <span className="font-medium leading-relaxed">{item.text}</span>
                {isMatched(item.id) && (
                  <motion.span
                    initial={reduceMotion ? false : { scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white"
                    aria-hidden="true"
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </motion.span>
                )}
                {isSelected(item.id, "answer") && !isMatched(item.id) && (
                  <motion.div
                    initial={reduceMotion ? false : { opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute bottom-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white"
                    aria-hidden="true"
                  >
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Celebration overlay */}
      {showCelebration && (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="celebration-title"
        >
          <motion.div
            initial={reduceMotion ? false : { y: 20 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
            className="relative w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl"
          >
            <motion.div
              animate={reduceMotion ? undefined : { rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2 }}
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-600"
            >
              <Trophy className="h-8 w-8 text-white" strokeWidth={2} aria-hidden="true" />
            </motion.div>
            <h2 id="celebration-title" className="text-2xl font-semibold text-navy-ink mb-2">
              Perfect Match!
            </h2>
            <p className="text-slate-600 mb-6">
              You've matched all {originalPairs.length} pairs!
            </p>
            <div className="grid grid-cols-3 gap-4 mb-6 text-center">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="font-mono text-2xl font-bold text-navy-ink">{score}</p>
                <p className="text-xs text-slate-500">Final Score</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="font-mono text-2xl font-bold text-navy-ink">{bestStreak}</p>
                <p className="text-xs text-slate-500">Best Streak</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="font-mono text-2xl font-bold text-navy-ink">
                  {Math.round((Date.now() - startTimeRef.current) / 1000)}s
                </p>
                <p className="text-xs text-slate-500">Time</p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="pressable inline-flex items-center justify-center gap-2 w-full rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:shadow-lg hover:shadow-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <RefreshCw className="h-4 w-4" strokeWidth={2} />
              Play Again
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* Reset button when not complete */}
      {!gameComplete && (
        <div className="mt-6 text-center">
          <button
            onClick={handleReset}
            className="pressable inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:border-primary hover:text-primary hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <RefreshCw className="h-4 w-4" strokeWidth={2} />
            Shuffle & Restart
          </button>
        </div>
      )}

      {/* Instructions */}
      <details className="mt-6">
        <summary className="cursor-pointer flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary">
          <Sparkles className="h-4 w-4" strokeWidth={2} />
          How to play
        </summary>
        <div className="mt-3 text-sm text-slate-600 space-y-2">
          <p>• Click a term on the left, then click its matching definition on the right</p>
          <p>• Or click a definition first, then its matching term</p>
          <p>• Correct matches stay highlighted and earn points</p>
          <p>• Build streaks for bonus points</p>
          <p>• Keyboard: Tab to navigate, Enter/Space to select, Escape to clear selection</p>
        </div>
      </details>
    </div>
  );
}