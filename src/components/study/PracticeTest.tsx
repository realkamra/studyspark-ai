import { motion } from "framer-motion";
import { ArrowRight, Award, History, RotateCcw, Target } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Progress } from "@/components/ui/progress";
import type { QuizQuestion } from "../../types/study";

interface Props {
  materialId: Id<"materials">;
  quiz: QuizQuestion[];
  onExit?: () => void;
}

/** Fisher–Yates shuffle (in place, returns a copy-safe array). */
function shuffled<T>(source: T[]): T[] {
  const copy = [...source];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Build a shuffled display order for each question's options.
 * Returns order[i] = array of original option indices in display order,
 * so the correct answer sits at order[i].indexOf(quiz[i].correctIndex).
 */
function buildOrders(quiz: QuizQuestion[]): number[][] {
  return quiz.map((q) =>
    shuffled(q.options.map((_, optionIndex) => optionIndex)),
  );
}

export default function PracticeTest({ materialId, quiz, onExit }: Props) {
  const recordAttempt = useMutation(api.materials.recordQuizAttempt);
  const pastAttempts = useQuery(api.materials.getQuizAttempts, { materialId });

  const [orders, setOrders] = useState<number[][]>(() => buildOrders(quiz));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    quiz.map(() => null),
  );
  const [finished, setFinished] = useState(false);
  const savedRef = useRef(false);

  const question = quiz[index];
  const options = question ? orders[index].map((orig) => question.options[orig]) : [];
  const correctDisplayIndex = question ? orders[index].indexOf(question.correctIndex) : -1;

  // Score once we've finished — count where the chosen option matches correctly.
  const score = useMemo(
    () => answers.filter((a, i) => a !== null && a === quiz[i].correctIndex).length,
    [answers, quiz],
  );

  const reviewTopics = useMemo(() => {
    const topics = new Set<string>();
    answers.forEach((a, i) => {
      if (a !== quiz[i].correctIndex) {
        topics.add(quiz[i].topic || "General");
      }
    });
    return [...topics];
  }, [answers, quiz]);

  const percent = quiz.length ? (score / quiz.length) * 100 : 0;
  const verdict =
    percent >= 90 ? "Crushed it" : percent >= 70 ? "Solid work" : "Review time";

  // Persist the attempt exactly once when the run completes.
  useEffect(() => {
    if (finished && !savedRef.current) {
      savedRef.current = true;
      void recordAttempt({
        materialId,
        score,
        total: quiz.length,
        reviewTopics,
      });
    }
  }, [finished, recordAttempt, materialId, score, quiz.length, reviewTopics]);

  /** Choose an option (once per question — locks it in). */
  const choose = (displayIndex: number) => {
    if (selected !== null || finished) return;
    const originalIndex = orders[index][displayIndex];
    setSelected(displayIndex);
    setAnswers((prev) => prev.map((a, i) => (i === index ? originalIndex : a)));
  };

  const next = () => {
    setSelected(null);
    if (index + 1 < quiz.length) {
      setIndex(index + 1);
    } else {
      setFinished(true);
    }
  };

  const retake = () => {
    setOrders(buildOrders(quiz));
    setIndex(0);
    setSelected(null);
    setAnswers(quiz.map(() => null));
    setFinished(false);
    savedRef.current = false;
  };

  // ------------------------------------------------------------------
  // Completion screen
  // ------------------------------------------------------------------
  if (finished) {
    return (
      <div className="mx-auto w-full max-w-xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[26px] bg-[#17201d] p-8 text-white text-center"
        >
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#d8f36a]">
            <Award className="h-8 w-8 text-[#17201d]" />
          </span>
          <h2 className="mt-5 text-3xl font-extrabold tracking-[-0.04em]">
            {score} of {quiz.length} correct
          </h2>
          <p className="mt-1 text-sm font-bold text-[#d8f36a]">{verdict}</p>
          <Progress
            value={percent}
            className="mb-2 mt-6 h-2 bg-white/10"
          />
          <div className="mt-1 text-xs font-bold text-white/50">
            {Math.round(percent)}% accuracy
          </div>
        </motion.div>

        {reviewTopics.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-5 rounded-[22px] border border-[#17201d]/10 bg-white p-6"
          >
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#ef5f47]">
              <Target className="h-4 w-4" /> Review these next
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {reviewTopics.map((topic) => (
                <span
                  key={topic}
                  className="rounded-full bg-[#ff967f] px-3 py-1 text-xs font-bold text-[#17201d]"
                >
                  {topic}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {pastAttempts && pastAttempts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mt-5 rounded-[22px] border border-[#17201d]/10 bg-white p-6"
          >
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#87908a]">
              <History className="h-4 w-4" /> Your past practice tests
            </p>
            <div className="mt-3 space-y-2">
              {pastAttempts.map((attempt, i) => {
                const attemptPercent = attempt.total
                  ? Math.round((attempt.score / attempt.total) * 100)
                  : 0;
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl bg-[#f7f8f5] px-4 py-2.5 text-sm"
                  >
                    <span className="font-bold text-[#17201d]">
                      {attempt.score}/{attempt.total}
                    </span>
                    <span className="text-xs font-bold text-[#68736c]">
                      {new Date(attempt.takenAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      · {attemptPercent}%
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={retake}
            className="inline-flex items-center gap-2 rounded-xl bg-[#d8f36a] px-5 py-3 text-sm font-bold text-[#17201d] shadow-[0_3px_0_#b7d94a] transition-transform hover:-translate-y-0.5"
          >
            <RotateCcw className="h-4 w-4" /> Retake
          </button>
          {onExit && (
            <button
              type="button"
              onClick={onExit}
              className="inline-flex items-center gap-2 rounded-xl border border-[#17201d]/15 bg-white px-5 py-3 text-sm font-bold text-[#68736c] transition-colors hover:text-[#17201d]"
            >
              Back to the guide
            </button>
          )}
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Question screen
  // ------------------------------------------------------------------
  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#87908a]">
          Question {index + 1} of {quiz.length}
        </span>
        <span className="text-xs font-bold text-[#ef5f47]">
          {quiz[index].topic || "Practice test"}
        </span>
      </div>
      <Progress value={(index / quiz.length) * 100} className="mb-6 h-2" />

      <motion.div
        key={index}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[26px] border border-[#17201d]/10 bg-white p-6 sm:p-8"
      >
        <h3 className="text-xl font-extrabold leading-snug tracking-[-0.02em] text-[#17201d] sm:text-2xl">
          {question.question}
        </h3>

        <div className="mt-6 space-y-3">
          {options.map((option, displayIndex) => {
            const isCorrect = displayIndex === correctDisplayIndex;
            const isChosen = displayIndex === selected;
            let style =
              "border-[#17201d]/12 bg-white text-[#17201d] hover:border-[#17201d]/30";
            if (selected !== null) {
              if (isCorrect) {
                style = "border-[#a9cf3f] bg-[#d8f36a] text-[#17201d]";
              } else if (isChosen) {
                style = "border-[#e06a4e] bg-[#ff967f] text-[#17201d]";
              } else {
                style = "border-[#17201d]/8 bg-white text-[#87908a] opacity-60";
              }
            }
            return (
              <button
                key={displayIndex}
                type="button"
                onClick={() => choose(displayIndex)}
                disabled={selected !== null}
                className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left text-sm font-bold transition-all disabled:cursor-default ${
                  selected === null ? "hover:-translate-y-0.5" : ""
                } ${style}`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold ${
                    selected !== null && isCorrect
                      ? "bg-[#17201d]/10 text-[#17201d]"
                      : selected !== null && isChosen
                        ? "bg-[#17201d]/10 text-[#17201d]"
                        : "bg-[#f7f8f5] text-[#68736c]"
                  }`}
                >
                  {String.fromCharCode(65 + displayIndex)}
                </span>
                {option}
              </button>
            );
          })}
        </div>

        {selected !== null && question.explanation && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 rounded-xl border border-[#17201d]/8 bg-[#f7f8f5] px-4 py-3 text-sm leading-6 text-[#37433d]"
          >
            <span className="font-bold text-[#17201d]">Why: </span>
            {question.explanation}
          </motion.p>
        )}

        {selected !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 flex justify-end"
          >
            <button
              type="button"
              onClick={next}
              className="inline-flex items-center gap-2 rounded-xl bg-[#17201d] px-5 py-3 text-sm font-bold text-white shadow-[0_3px_0_#0c100e] transition-transform hover:-translate-y-0.5"
            >
              {index + 1 < quiz.length ? "Next question" : "See results"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}