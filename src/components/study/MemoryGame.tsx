"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Brain, Loader2, RefreshCw, Sparkles, Star, Timer } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Flashcard } from "../../types/study";

interface Props {
  materialId: string;
  flashcards: Flashcard[];
}

const MAX_CARDS = 12; // 6 pairs max

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function createCardPairs(flashcards: Flashcard[]) {
  // Take up to 6 flashcards to make 6 pairs (12 cards)
  const selected = flashcards.slice(0, 6);
  const cards = selected.flatMap((card, index) => [
    { id: `${card.id}-front`, pairId: card.id, content: card.front, type: "front" as const, hint: card.hint },
    { id: `${card.id}-back`, pairId: card.id, content: card.back, type: "back" as const, hint: undefined },
  ]);
  return shuffleArray(cards);
}

export default function MemoryGame({ flashcards }: Props) {
  const reduceMotion = useReducedMotion();
  const [cards, setCards] = useState<Array<{ id: string; pairId: string; content: string; type: "front" | "back"; hint?: string; flipped: boolean; matched: boolean }>>([]);
  const [flippedIds, setFlippedIds] = useState<string[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [canFlip, setCanFlip] = useState(true);
  const startTimeRef = useRef<number>(Date.now());
  const bestScoreRef = useRef<number>(0);

  // Initialize game
  useEffect(() => {
    if (flashcards.length === 0) return;

    const pairs = createCardPairs(flashcards);
    setCards(pairs.map((c) => ({ ...c, flipped: false, matched: false })));
    setFlippedIds([]);
    setMatchedPairs(new Set());
    setMoves(0);
    setScore(0);
    setGameComplete(false);
    setShowCelebration(false);
    setAnnouncement("Find matching pairs. Click cards to flip them.");
    startTimeRef.current = Date.now();
    setCanFlip(true);
  }, [flashcards]);

  const handleCardClick = useCallback((cardId: string) => {
    if (!canFlip) return;

    const card = cards.find((c) => c.id === cardId);
    if (!card || card.flipped || card.matched) return;

    // Flip the card
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, flipped: true } : c))
    );
    setFlippedIds((prev) => [...prev, cardId]);

    // Check for match when two cards are flipped
    if (flippedIds.length === 1) {
      const firstId = flippedIds[0];
      const firstCard = cards.find((c) => c.id === firstId);
      const secondCard = cards.find((c) => c.id === cardId);

      setMoves((prev) => prev + 1);
      setCanFlip(false);

      if (firstCard && secondCard && firstCard.pairId === secondCard.pairId) {
        // Match found!
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.pairId === firstCard.pairId ? { ...c, matched: true, flipped: true } : c
            )
          );
          setMatchedPairs((prev) => new Set([...prev, firstCard.pairId]));
          setFlippedIds([]);

          const points = 100 + matchedPairs.size * 20;
          setScore((prev) => prev + points);

          setAnnouncement(`Match found! "${firstCard.content.slice(0, 30)}..." matched. +${points} points`);

          // Check if game complete
          if (matchedPairs.size + 1 === Math.ceil(flashcards.slice(0, 6).length)) {
            setTimeout(() => {
              setGameComplete(true);
              setShowCelebration(true);
              const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);
              const finalScore = score + points;
              setBestScore((prev) => Math.max(prev, finalScore));
              bestScoreRef.current = Math.max(bestScoreRef.current, finalScore);
              setAnnouncement(`Game complete! Score: ${finalScore} | Moves: ${moves + 1} | Time: ${timeTaken}s`);
            }, 500);
          } else {
            setCanFlip(true);
          }
        }, reduceMotion ? 100 : 600);
      } else {
        // No match - flip back after delay
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              c.id === firstId || c.id === cardId ? { ...c, flipped: false } : c
            )
          );
          setFlippedIds([]);
          setAnnouncement("No match. Try again.");
          setCanFlip(true);
        }, reduceMotion ? 100 : 1000);
      }
    }
  }, [cards, flippedIds, matchedPairs.size, flashcards.length, moves, score, reduceMotion]);

  const handleReset = useCallback(() => {
    const pairs = createCardPairs(flashcards);
    setCards(pairs.map((c) => ({ ...c, flipped: false, matched: false })));
    setFlippedIds([]);
    setMatchedPairs(new Set());
    setMoves(0);
    setScore(0);
    setGameComplete(false);
    setShowCelebration(false);
    setAnnouncement("Find matching pairs. Click cards to flip them.");
    startTimeRef.current = Date.now();
    setCanFlip(true);
  }, [flashcards]);

  return (
    <div className="mx-auto max-w-4xl" role="region" aria-label="Memory Game" aria-live="polite">
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
            <Brain className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-xl font-semibold text-navy-ink">Memory Game</h2>
            <p className="text-sm text-slate-600">Find matching pairs from your flashcards</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-4 py-2">
            <Star className="h-4 w-4 text-amber-500" aria-hidden="true" />
            <span className="font-mono text-lg font-semibold text-navy-ink">{score}</span>
            <span className="text-xs text-slate-500">points</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-4 py-2">
            <Timer className="h-4 w-4 text-primary" aria-hidden="true" />
            <span className="font-mono text-lg font-semibold text-navy-ink">{moves}</span>
            <span className="text-xs text-slate-500">moves</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-4 py-2">
            <Sparkles className="h-4 w-4 text-green-500" aria-hidden="true" />
            <span className="font-mono text-lg font-semibold text-navy-ink">{matchedPairs.size} / {Math.ceil(flashcards.slice(0, 6).length)}</span>
            <span className="text-xs text-slate-500">pairs found</span>
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
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        style={{
          animationDuration: reduceMotion ? "0.01ms" : "400ms",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          maxWidth: "600px",
          margin: "0 auto",
        }}
        className="grid gap-3"
        role="list"
        aria-label="Memory cards"
      >
        {cards.map((card, index) => (
          <motion.button
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            disabled={card.flipped || card.matched || gameComplete || !canFlip}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.02, ease: [0.23, 1, 0.32, 1] }}
            style={{ animationDuration: reduceMotion ? "0.01ms" : "300ms" }}
            // Hover and press states handled via pressable and CSS hover (no whileHover/whileTap to avoid HW-accel miss and touch false-positive)
            className={`
              pressable relative aspect-square rounded-xl border-2
              transition-[border-color,background-color,box-shadow,transform] duration-[var(--duration-normal)] ease-[var(--ease-out)]
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
              ${card.matched
                ? "bg-green-50 border-green-300 cursor-default"
                : card.flipped
                ? "bg-white border-primary shadow-lg"
                : "bg-white border-slate-200 hover:border-primary/50 hover:shadow-md"
              }
            `}
            role="listitem"
            aria-pressed={card.flipped}
            aria-disabled={card.flipped || card.matched || gameComplete}
            aria-label={card.flipped ? `${card.content}, face up` : card.matched ? `${card.content}, matched` : "Face down card"}
          >
            <div
              className="relative w-full h-full transform-style-3d transition-transform duration-500 ease-[var(--ease-in-out)]"
              style={{
                transform: card.flipped || card.matched ? "rotateY(180deg)" : "rotateY(0deg)",
                transformStyle: "preserve-3d",
              }}
            >
              {/* Back of card (face down) */}
              <div
                className="absolute inset-0 w-full h-full rounded-xl backface-hidden flex items-center justify-center bg-gradient-to-br from-primary/10 to-blue-600/10 border border-slate-200"
                style={{
                  transform: card.flipped || card.matched ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
                aria-hidden="true"
              >
                <Brain className="h-8 w-8 text-primary/50" strokeWidth={1.5} />
              </div>

              {/* Front of card (face up) */}
              <motion.div
                initial={reduceMotion ? false : { rotateY: 180 }}
                animate={{ rotateY: card.flipped || card.matched ? 0 : 180 }}
                transition={{ duration: 0.5, ease: [0.77, 0, 0.175, 1] }}
                className="absolute inset-0 w-full h-full rounded-xl backface-hidden flex items-center justify-center p-4 bg-white border border-slate-200 shadow-sm"
                style={{
                  transform: card.flipped || card.matched ? "rotateY(0deg)" : "rotateY(180deg)",
                  transformStyle: "preserve-3d",
                }}
              >
                <div className="text-center">
                  <p className="text-sm font-medium text-navy-ink leading-relaxed">{card.content}</p>
                  {card.hint && (
                    <p className="mt-2 text-xs text-slate-500 italic">Hint: {card.hint}</p>
                  )}
                  {card.matched && (
                    <motion.span
                      initial={reduceMotion ? false : { scale: 0.92, opacity: 0, rotate: -180 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                      className="inline-flex mt-2 h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white"
                      aria-hidden="true"
                    >
                      <Star className="h-3 w-3" strokeWidth={3} />
                    </motion.span>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.button>
        ))}
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
          aria-labelledby="memory-celebration-title"
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
              <Brain className="h-8 w-8 text-white" strokeWidth={2} aria-hidden="true" />
            </motion.div>
            <h2 id="memory-celebration-title" className="text-2xl font-semibold text-navy-ink mb-2">
              Memory Master!
            </h2>
            <p className="text-slate-600 mb-6">
              You found all {Math.ceil(flashcards.slice(0, 6).length)} pairs!
            </p>
            <div className="grid grid-cols-3 gap-4 mb-6 text-center">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="font-mono text-2xl font-bold text-navy-ink">{score}</p>
                <p className="text-xs text-slate-500">Final Score</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="font-mono text-2xl font-bold text-navy-ink">{moves}</p>
                <p className="text-xs text-slate-500">Moves</p>
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
          <p>• Click any card to flip it over</p>
          <p>• Click a second card to find its match</p>
          <p>• Matched pairs stay face up</p>
          <p>• Unmatched pairs flip back down</p>
          <p>• Complete the game in as few moves as possible</p>
          <p>• Keyboard: Tab to navigate, Enter/Space to flip, Escape to clear</p>
        </div>
      </details>
    </div>
  );
}