"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, Loader2, RefreshCw, Sparkles, Target, Trophy } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import React from "react";
import type { StudyKit } from "../../types/study";

interface Props {
  materialId: string;
  kit: StudyKit;
}

function generateClozeQuestions(kit: StudyKit): Array<{ id: string; question: string; answer: string; hint?: string }> {
  const questions: Array<{ id: string; question: string; answer: string; hint?: string }> = [];

  // Extract key terms from guide sections
  kit.guide?.sections.forEach((section, sectionIndex) => {
    // Use first sentence as a cloze
    const sentences = section.body.split(/[.!?]+/).filter(s => s.trim().length > 15);
    sentences.slice(0, 2).forEach((sentence, sentenceIndex) => {
      const words = sentence.trim().split(/\s+/);
      if (words.length < 6) return;

      // Find a good word to blank out (noun, verb, adjective - longer words)
      const candidates = words
        .map((word, idx) => ({ word: word.replace(/[.,!?;:]$/, ""), idx }))
        .filter(({ word }) => word.length > 4 && /^[A-Za-z]+$/.test(word));

      if (candidates.length > 0) {
        // Pick a random candidate
        const chosen = candidates[Math.floor(Math.random() * candidates.length)];
        const blankedWords = [...words];
        blankedWords[chosen.idx] = "______";
        const question = blankedWords.join(" ");
        questions.push({
          id: `cloze-${sectionIndex}-${sentenceIndex}`,
          question,
          answer: chosen.word,
          hint: `Section: ${section.heading}`,
        });
      }
    });
  });

  // Also use flashcard fronts as cloze questions
  kit.flashcards?.slice(0, 4).forEach((card, index) => {
    const words = card.front.split(/\s+/);
    if (words.length >= 3) {
      const chosenIdx = Math.floor(words.length / 2);
      const originalWord = words[chosenIdx].replace(/[.,!?;:]$/, "");
      if (originalWord.length > 2) {
        const blankedWords = [...words];
        blankedWords[chosenIdx] = "______";
        questions.push({
          id: `flashcard-${index}`,
          question: blankedWords.join(" "),
          answer: originalWord,
          hint: card.hint,
        });
      }
    }
  });

  // Use game pairs as cloze
  kit.gamePairs?.slice(0, 3).forEach((pair, index) => {
    const words = pair.prompt.split(/\s+/);
    if (words.length >= 3) {
      const chosenIdx = Math.floor(words.length / 2);
      const originalWord = words[chosenIdx].replace(/[.,!?;:]$/, "");
      if (originalWord.length > 2) {
        const blankedWords = [...words];
        blankedWords[chosenIdx] = "______";
        questions.push({
          id: `gamepair-${index}`,
          question: blankedWords.join(" "),
          answer: originalWord,
          hint: pair.hint,
        });
      }
    }
  });

  // Shuffle and return up to 10 questions
  return questions
    .sort(() => Math.random() - 0.5)
    .slice(0, 10);
}

export default function FillInBlank({ kit }: Props) {
  const reduceMotion = useReducedMotion();
  const [questions, setQuestions] = useState<Array<{ id: string; question: string; answer: string; hint?: string }>>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Initialize questions
  useEffect(() => {
    if (!kit) return;
    const generated = generateClozeQuestions(kit);
    setQuestions(generated);
    setCurrentIndex(0);
    setUserAnswer("");
    setSubmitted(false);
    setCorrect(null);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setShowResult(false);
    setGameComplete(false);
    setShowCelebration(false);
    setAnnouncement("Fill in the blank. Type your answer and press Enter.");
    startTimeRef.current = Date.now();
  }, [kit]);

  // Focus input when question changes
  useEffect(() => {
    inputRef.current?.focus();
  }, [currentIndex]);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const progress = questions.length > 0 ? ((currentIndex) / questions.length) * 100 : 0;

  const checkAnswer = useCallback(() => {
    if (!currentQuestion || submitted) return;

    const normalizedUser = userAnswer.trim().toLowerCase();
    const normalizedAnswer = currentQuestion.answer.trim().toLowerCase();
    const isCorrect = normalizedUser === normalizedAnswer;

    setSubmitted(true);
    setCorrect(isCorrect);

    if (isCorrect) {
      const points = 100 + streak * 20;
      setScore((prev) => prev + points);
      setStreak((prev) => {
        const newStreak = prev + 1;
        setBestStreak((best) => Math.max(best, newStreak));
        return newStreak;
      });
      setAnnouncement(`Correct! "${currentQuestion.answer}" is the right answer. +${points} points`);
    } else {
      setStreak(0);
      setAnnouncement(`Not quite. The answer was "${currentQuestion.answer}".`);
    }

    setShowResult(true);
    setTimeout(() => {
      if (isLastQuestion) {
        setGameComplete(true);
        setShowCelebration(true);
        const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);
        setAnnouncement(`Game complete! Score: ${score + (isCorrect ? 100 + streak * 20 : 0)} | Streak: ${bestStreak} | Time: ${timeTaken}s`);
      } else {
        setCurrentIndex((prev) => prev + 1);
        setUserAnswer("");
        setSubmitted(false);
        setCorrect(null);
        setShowResult(false);
        setAnnouncement("Next question. Fill in the blank.");
      }
    }, reduceMotion ? 300 : 1500);
  }, [currentQuestion, userAnswer, submitted, streak, isLastQuestion, score, bestStreak, reduceMotion]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !submitted && userAnswer.trim()) {
      checkAnswer();
    } else if (e.key === "Enter" && showResult && !gameComplete) {
      // Already handled by timeout
    } else if (e.key === "Enter" && gameComplete) {
      handleReset();
    }
  }, [submitted, userAnswer, showResult, gameComplete, checkAnswer]);

  const handleReset = useCallback(() => {
    const generated = generateClozeQuestions(kit);
    setQuestions(generated);
    setCurrentIndex(0);
    setUserAnswer("");
    setSubmitted(false);
    setCorrect(null);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setShowResult(false);
    setGameComplete(false);
    setShowCelebration(false);
    setAnnouncement("Fill in the blank. Type your answer and press Enter.");
    startTimeRef.current = Date.now();
  }, [kit]);

  const handleSkip = useCallback(() => {
    if (isLastQuestion) {
      setGameComplete(true);
      setShowCelebration(true);
      const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);
      setAnnouncement(`Game complete! Score: ${score} | Best streak: ${bestStreak} | Time: ${timeTaken}s`);
    } else {
      setCurrentIndex((prev) => prev + 1);
      setUserAnswer("");
      setSubmitted(false);
      setCorrect(null);
      setShowResult(false);
      setAnnouncement("Skipped. Next question.");
    }
  }, [isLastQuestion, score, bestStreak]);

  if (questions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
        <Sparkles className="mx-auto h-12 w-12 text-slate-400" strokeWidth={1.5} />
        <h3 className="mt-4 text-lg font-semibold text-navy-ink">No questions available</h3>
        <p className="mt-2 text-slate-600">Generate a study kit first to create fill-in-the-blank questions.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl" role="region" aria-label="Fill in the Blank Game" aria-live="polite">
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
            <h2 className="text-xl font-semibold text-navy-ink">Fill in the Blank</h2>
            <p className="text-sm text-slate-600">Complete the sentences from your study material</p>
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
            <span className="font-mono text-lg font-semibold text-navy-ink">{currentIndex + 1} / {questions.length}</span>
          </div>
        </div>
      </motion.div>

      {/* Progress bar */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        style={{ animationDuration: reduceMotion ? "0.01ms" : "400ms" }}
        className="mb-6 h-2 w-full overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Game progress"
      >
        <motion.div
          initial={reduceMotion ? false : { scaleX: 0 }}
          animate={{ scaleX: progress / 100 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          style={{
            transformOrigin: "left center",
            animationDuration: reduceMotion ? "0.01ms" : "300ms",
          }}
          className="h-full bg-gradient-to-r from-primary to-blue-600"
        />
      </motion.div>

      {/* Announcement */}
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

      {/* Question card */}
      <motion.div
        key={currentQuestion.id}
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        style={{ animationDuration: reduceMotion ? "0.01ms" : "300ms" }}
        className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Question {currentIndex + 1} of {questions.length}
          </p>
          <p className="text-xl font-medium text-navy-ink leading-relaxed">
            {(() => {
              const parts = currentQuestion.question.split("______");
              return (
                <>
                  {parts.map((part, i) => (
                    <React.Fragment key={i}>
                      {part}
                      {i < parts.length - 1 && (
                        <span className="relative inline-block mx-1 px-2">
                          <input
                            ref={inputRef}
                            type="text"
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={submitted || gameComplete}
                            className={`
                              w-40 min-w-[120px] text-center bg-transparent border-b-2
                              font-medium text-navy-ink outline-none
                              ${submitted
                                ? correct
                                  ? "border-green-500 text-green-700 bg-green-50"
                                  : "border-red-500 text-red-700 bg-red-50"
                                : "border-slate-300 hover:border-primary focus:border-primary"
                              }
                            `}
                            placeholder="Type here..."
                            autoComplete="off"
                            spellCheck={false}
                            aria-label="Fill in the blank"
                            aria-invalid={submitted && !correct}
                          />
                          {submitted && correct && (
                            <motion.span
                              initial={reduceMotion ? false : { scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ type: "spring", stiffness: 200, damping: 15 }}
                              className="absolute -bottom-5 left-1/2 -translate-x-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white"
                              aria-hidden="true"
                            >
                              <Check className="h-3 w-3" strokeWidth={3} />
                            </motion.span>
                          )}
                        </span>
                      )}
                    </React.Fragment>
                  ))}
                </>
              );
            })()}
          </p>
          {currentQuestion.hint && (
            <p className="mt-3 text-sm text-slate-500">
              <span className="font-medium">Hint:</span> {currentQuestion.hint}
            </p>
          )}
        </div>

        {showResult && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className={`
              rounded-xl p-4 text-center
              ${correct ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}
            `}
          >
            {correct ? (
              <>
                <p className="font-semibold text-green-800">Correct!</p>
                <p className="mt-1 text-sm text-green-700">The answer was <span className="font-mono">"{currentQuestion.answer}"</span></p>
              </>
            ) : (
              <>
                <p className="font-semibold text-red-800">Not quite</p>
                <p className="mt-1 text-sm text-red-700">The correct answer was <span className="font-mono">"{currentQuestion.answer}"</span></p>
              </>
            )}
          </motion.div>
        )}

        {!submitted && !gameComplete && (
          <div className="mt-6 flex gap-3">
            <button
              onClick={checkAnswer}
              disabled={!userAnswer.trim()}
              className="pressable flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:shadow-lg hover:shadow-primary/25 disabled:opacity-40 disabled:hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Check className="h-4 w-4" strokeWidth={2} />
              Submit
            </button>
            <button
              onClick={handleSkip}
              className="pressable flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 hover:border-primary hover:text-primary hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Skip
            </button>
          </div>
        )}
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
          aria-labelledby="fill-celebration-title"
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
            <h2 id="fill-celebration-title" className="text-2xl font-semibold text-navy-ink mb-2">
              Fill-in-the-Blank Master!
            </h2>
            <p className="text-slate-600 mb-6">
              You completed all {questions.length} questions!
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
            Restart Game
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
          <p>• Read the sentence with the blank (______)</p>
          <p>• Type the missing word and press Enter or click Submit</p>
          <p>• Correct answers earn points and build your streak</p>
          <p>• Use the hint if you're stuck</p>
          <p>• Keyboard: Type answer, Enter to submit, Enter again for next</p>
        </div>
      </details>
    </div>
  );
}