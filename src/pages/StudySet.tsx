import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  FileText,
  Layers3,
  PartyPopper,
  Puzzle,
  RotateCcw,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useQuery } from "convex/react";
import logo from "@/assets/logo.svg";
import { api } from "@/convex/_generated/api";
import { FoxMascot } from "@/components/FoxMascot";

type StudySetDoc = {
  _id: string;
  title: string;
  sourceNotes: string;
  sections: Array<{
    heading: string;
    body: string;
    keyTerms: Array<{ term: string; definition: string }>;
  }>;
  flashcards: Array<{ front: string; back: string }>;
  quiz: Array<{
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>;
  matching: { pairs: Array<{ term: string; definition: string }> };
  createdAt: number;
};

type StudyMode = "notes" | "flashcards" | "quiz" | "matching";

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function StudySetPage() {
  const navigate = useNavigate();
  const { setId } = useParams();
  const studySet = useQuery(api.studySets.getStudySet, {
    setId: (setId ?? "") as never,
  }) as StudySetDoc | null | undefined;

  const [mode, setMode] = useState<StudyMode>("notes");

  if (studySet === undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8f5] text-[#17201d]">
        <div className="text-center">
          <FoxMascot mood="thinking" size={90} className="mx-auto" />
          <p className="mt-4 text-sm font-bold text-[#68736c]">
            Digging through the den...
          </p>
        </div>
      </main>
    );
  }

  if (studySet === null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8f5] px-5 text-center text-[#17201d]">
        <div>
          <FoxMascot mood="sad" size={90} className="mx-auto" />
          <h1 className="mt-4 text-3xl font-extrabold">
            That study set wandered off.
          </h1>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#17201d] px-4 py-3 text-sm font-bold text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </button>
        </div>
      </main>
    );
  }

  const modes: Array<{ id: StudyMode; label: string; icon: typeof BookOpen }> = [
    { id: "notes", label: "Notes", icon: FileText },
    { id: "flashcards", label: "Flashcards", icon: Layers3 },
    { id: "quiz", label: "Quiz", icon: Brain },
    { id: "matching", label: "Matching", icon: Puzzle },
  ];

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#17201d]">
      <header className="border-b border-[#17201d]/10 bg-white">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between px-5 py-4 sm:px-8">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2.5"
          >
            <img
              src={logo}
              alt="Notefox mark"
              className="h-8 w-8 rounded-[9px] bg-[#17201d]"
            />
            <span className="text-[17px] font-extrabold tracking-[-0.03em]">
              notefox<span className="text-[#ef5f47]">.</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-2 rounded-xl border border-[#17201d]/15 px-3.5 py-2 text-sm font-bold text-[#68736c] transition-colors hover:text-[#17201d]"
          >
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-[1180px] px-5 pb-20 pt-10 sm:px-8">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[#ef5f47]">
              Study set · made {new Date(studySet.createdAt).toLocaleDateString()}
            </p>
            <h1 className="max-w-[640px] text-4xl font-extrabold leading-[0.98] tracking-[-0.055em] sm:text-5xl">
              {studySet.title}
            </h1>
          </div>
          <FoxMascot mood="excited" size={92} className="shrink-0 self-end" />
        </div>

        {/* Mode switcher */}
        <div className="mb-8 flex gap-2 overflow-x-auto rounded-2xl border border-[#17201d]/10 bg-white p-1.5">
          {modes.map(({ id, label, icon: Icon }) => (
            <button
              type="button"
              key={id}
              onClick={() => setMode(id)}
              className={`relative flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
                mode === id ? "text-white" : "text-[#68736c] hover:text-[#17201d]"
              }`}
            >
              {mode === id && (
                <motion.span
                  layoutId="mode-pill"
                  className="absolute inset-0 rounded-xl bg-[#17201d]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <Icon className="relative z-10 h-4 w-4" />
              <span className="relative z-10">{label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {mode === "notes" && <NotesView studySet={studySet} />}
            {mode === "flashcards" && <FlashcardsView studySet={studySet} />}
            {mode === "quiz" && <QuizView studySet={studySet} />}
            {mode === "matching" && <MatchingView studySet={studySet} />}
          </motion.div>
        </AnimatePresence>
      </section>
    </main>
  );
}

/* ---------------- Notes ---------------- */

function NotesView({ studySet }: { studySet: StudySetDoc }) {
  return (
    <div className="space-y-4">
      {studySet.sections.map((section, index) => (
        <motion.article
          key={index}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="rounded-[22px] border border-[#17201d]/10 bg-white p-6 sm:p-7"
        >
          <div className="flex items-start gap-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#d8f36a] text-sm font-extrabold">
              {index + 1}
            </span>
            <div className="min-w-0">
              <h2 className="text-xl font-extrabold tracking-[-0.03em]">
                {section.heading}
              </h2>
              <p className="mt-2 max-w-[640px] text-sm leading-6 text-[#3f4a43]">
                {section.body}
              </p>

              {section.keyTerms.length > 0 && (
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {section.keyTerms.map((keyTerm, termIndex) => (
                    <div
                      key={termIndex}
                      className="rounded-xl bg-[#fffaf2] p-3"
                    >
                      <p className="text-xs font-extrabold text-[#ef5f47]">
                        {keyTerm.term}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[#68736c]">
                        {keyTerm.definition}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.article>
      ))}

      <details className="group rounded-[22px] border border-dashed border-[#17201d]/20 bg-white p-5">
        <summary className="cursor-pointer text-xs font-bold uppercase tracking-[0.12em] text-[#87908a]">
          Your original notes
        </summary>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#68736c]">
          {studySet.sourceNotes}
        </p>
      </details>
    </div>
  );
}

/* ---------------- Flashcards ---------------- */

function FlashcardsView({ studySet }: { studySet: StudySetDoc }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState<Set<number>>(new Set());

  const cards = studySet.flashcards;
  const card = cards[Math.min(index, cards.length - 1)];

  const goTo = (next: number) => {
    setFlipped(false);
    setIndex(Math.max(0, Math.min(next, cards.length - 1)));
    setDone((previous) => new Set(previous).add(index));
  };

  if (cards.length === 0) {
    return <p className="text-sm text-[#68736c]">No flashcards in this set.</p>;
  }

  return (
    <div className="mx-auto max-w-[620px]">
      <div className="mb-4 flex items-center justify-between text-xs font-bold text-[#87908a]">
        <span>
          Card {index + 1} of {cards.length} · {done.size} reviewed
        </span>
        <span>Click the card to flip it</span>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((value) => !value)}
        className="block h-[300px] w-full [perspective:1200px]"
        aria-label={flipped ? "Show question side" : "Show answer side"}
      >
        <motion.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
          className="relative h-full w-full [transform-style:preserve-3d]"
        >
          {/* Front */}
          <div className="absolute inset-0 flex flex-col justify-between rounded-[24px] border-2 border-[#17201d] bg-[#d8f36a] p-7 [backface-visibility:hidden]">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#17201d]/60">
              Question
            </span>
            <p className="text-center text-2xl font-extrabold leading-tight tracking-[-0.03em]">
              {card.front}
            </p>
            <span className="text-center text-xs font-bold text-[#17201d]/50">
              Tap to reveal
            </span>
          </div>

          {/* Back */}
          <div className="absolute inset-0 flex flex-col justify-between rounded-[24px] border-2 border-[#17201d] bg-white p-7 [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#ef5f47]">
              Answer
            </span>
            <p className="text-center text-lg font-bold leading-snug">
              {card.back}
            </p>
            <span className="text-center text-xs font-bold text-[#87908a]">
              Tap to flip back
            </span>
          </div>
        </motion.div>
      </button>

      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#17201d]/15 bg-white transition-colors hover:bg-[#f7f8f5] disabled:opacity-40"
          aria-label="Previous card"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => goTo(index + 1)}
          disabled={index === cards.length - 1}
          className="inline-flex items-center gap-2 rounded-xl bg-[#17201d] px-5 py-3 text-sm font-bold text-white shadow-[0_3px_0_#0c100e] transition-transform hover:-translate-y-0.5 disabled:opacity-40"
        >
          Next card <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ---------------- Quiz ---------------- */

function QuizView({ studySet }: { studySet: StudySetDoc }) {
  const questions = studySet.quiz;
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  if (questions.length === 0) {
    return <p className="text-sm text-[#68736c]">No quiz questions in this set.</p>;
  }

  const question = questions[current];
  const isLast = current === questions.length - 1;

  const choose = (optionIndex: number) => {
    if (selected !== null) return;
    setSelected(optionIndex);
    if (optionIndex === question.correctIndex) {
      setScore((value) => value + 1);
    }
  };

  const next = () => {
    if (isLast) {
      setFinished(true);
    } else {
      setCurrent((value) => value + 1);
      setSelected(null);
    }
  };

  const restart = () => {
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  };

  if (finished) {
    const percent = Math.round((score / questions.length) * 100);
    const mood = percent >= 80 ? "excited" : percent >= 50 ? "idle" : "sad";
    const message =
      percent >= 80
        ? "Fox-tastic! You really know this."
        : percent >= 50
          ? "Solid! One more round and you've got it."
          : "Rough one. The notes view is your friend.";

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto max-w-[480px] rounded-[26px] border border-[#17201d]/10 bg-white p-8 text-center"
      >
        <FoxMascot mood={mood} size={110} className="mx-auto" />
        <p className="mt-4 text-5xl font-extrabold tracking-[-0.05em]">
          {percent}%
        </p>
        <p className="mt-1 text-sm font-bold text-[#68736c]">
          {score} of {questions.length} correct
        </p>
        <p className="mt-4 text-sm font-extrabold">{message}</p>
        <button
          type="button"
          onClick={restart}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#17201d] px-5 py-3 text-sm font-bold text-white shadow-[0_3px_0_#0c100e] transition-transform hover:-translate-y-0.5"
        >
          <RotateCcw className="h-4 w-4" /> Try again
        </button>
      </motion.div>
    );
  }

  return (
    <div className="mx-auto max-w-[620px]">
      <div className="mb-4 flex items-center justify-between text-xs font-bold text-[#87908a]">
        <span>
          Question {current + 1} of {questions.length}
        </span>
        <span>Score: {score}</span>
      </div>

      <div className="rounded-[24px] border border-[#17201d]/10 bg-white p-6 sm:p-8">
        <h2 className="text-xl font-extrabold leading-snug tracking-[-0.02em]">
          {question.question}
        </h2>

        <div className="mt-6 space-y-2.5">
          {question.options.map((option, optionIndex) => {
            const isCorrect = optionIndex === question.correctIndex;
            const isSelected = optionIndex === selected;

            let optionClasses =
              "border-[#17201d]/15 bg-[#f7f8f5] hover:border-[#17201d]/35 hover:bg-white";

            if (selected !== null) {
              if (isCorrect) {
                optionClasses = "border-[#3e9b57] bg-[#e9f7ee]";
              } else if (isSelected) {
                optionClasses = "border-[#ef5f47] bg-[#ffefeb]";
              } else {
                optionClasses = "border-[#17201d]/10 bg-[#f7f8f5] opacity-60";
              }
            }

            return (
              <button
                type="button"
                key={optionIndex}
                onClick={() => choose(optionIndex)}
                disabled={selected !== null}
                className={`flex w-full items-center justify-between gap-3 rounded-xl border p-4 text-left text-sm font-bold transition-all ${optionClasses}`}
              >
                <span>{option}</span>
                {selected !== null && isCorrect && (
                  <Check className="h-4 w-4 shrink-0 text-[#3e9b57]" />
                )}
                {selected !== null && isSelected && !isCorrect && (
                  <X className="h-4 w-4 shrink-0 text-[#ef5f47]" />
                )}
              </button>
            );
          })}
        </div>

        {selected !== null && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 flex flex-col gap-3 rounded-xl bg-[#fffaf2] p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="text-xs leading-5 text-[#68736c]">
              <span className="font-extrabold text-[#17201d]">
                {selected === question.correctIndex ? "Nice! " : "Not quite. "}
              </span>
              {question.explanation}
            </p>
            <button
              type="button"
              onClick={next}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#17201d] px-4 py-2.5 text-sm font-bold text-white"
            >
              {isLast ? "See results" : "Next"}{" "}
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Matching game ---------------- */

interface MatchTile {
  key: string;
  label: string;
  pairId: string;
  kind: "term" | "definition";
}

function MatchingView({ studySet }: { studySet: StudySetDoc }) {
  const pairs = studySet.matching.pairs;
  const [round, setRound] = useState(0);
  const [first, setFirst] = useState<MatchTile | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrongPair, setWrongPair] = useState<string[] | null>(null);
  const [mistakes, setMistakes] = useState(0);

  const tiles = useMemo(() => {
    const base: MatchTile[] = pairs.flatMap((pair, pairIndex) => [
      {
        key: `term-${pairIndex}`,
        label: pair.term,
        pairId: `pair-${pairIndex}`,
        kind: "term" as const,
      },
      {
        key: `def-${pairIndex}`,
        label: pair.definition,
        pairId: `pair-${pairIndex}`,
        kind: "definition" as const,
      },
    ]);
    return shuffle(base);
    // Re-shuffle on each new round.
  }, [pairs, round]);

  const complete = matched.size === pairs.length && pairs.length > 0;

  const resetRound = useCallback(() => {
    setFirst(null);
    setMatched(new Set());
    setWrongPair(null);
    setMistakes(0);
  }, []);

  useEffect(() => {
    resetRound();
  }, [round, resetRound]);

  if (pairs.length < 3) {
    return (
      <p className="text-sm text-[#68736c]">
        Not enough pairs for a matching game in this set.
      </p>
    );
  }

  const handleTileClick = (tile: MatchTile) => {
    if (matched.has(tile.pairId) || wrongPair) return;

    if (!first) {
      setFirst(tile);
      return;
    }

    if (first.key === tile.key) {
      setFirst(null);
      return;
    }

    if (first.pairId === tile.pairId && first.kind !== tile.kind) {
      const nextMatched = new Set(matched);
      nextMatched.add(tile.pairId);
      setMatched(nextMatched);
      setFirst(null);
    } else {
      setWrongPair([first.key, tile.key]);
      setMistakes((value) => value + 1);
      window.setTimeout(() => {
        setWrongPair(null);
        setFirst(null);
      }, 700);
    }
  };

  return (
    <div className="mx-auto max-w-[760px]">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs font-bold text-[#87908a]">
          <span>
            Matched {matched.size} of {pairs.length}
          </span>
          <span className="ml-4">Misses: {mistakes}</span>
        </div>
        <button
          type="button"
          onClick={() => setRound((value) => value + 1)}
          className="inline-flex items-center gap-2 rounded-xl border border-[#17201d]/15 bg-white px-3.5 py-2 text-xs font-bold text-[#68736c] transition-colors hover:text-[#17201d]"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Shuffle & restart
        </button>
      </div>

      {complete ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-[26px] border border-[#17201d]/10 bg-white p-8 text-center"
        >
          <FoxMascot mood="excited" size={110} className="mx-auto" />
          <h2 className="mt-3 flex items-center justify-center gap-2 text-2xl font-extrabold">
            All matched! <PartyPopper className="h-6 w-6 text-[#ef5f47]" />
          </h2>
          <p className="mt-1 text-sm text-[#68736c]">
            You did it in {mistakes} {mistakes === 1 ? "miss" : "misses"}.{" "}
            {mistakes === 0
              ? "Flawless."
              : mistakes <= 3
                ? "Pretty sharp."
                : "The fox believes in you."}
          </p>
          <button
            type="button"
            onClick={() => setRound((value) => value + 1)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#17201d] px-5 py-3 text-sm font-bold text-white shadow-[0_3px_0_#0c100e] transition-transform hover:-translate-y-0.5"
          >
            <RotateCcw className="h-4 w-4" /> Play again
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          <AnimatePresence>
            {tiles.map((tile) => {
              const isMatched = matched.has(tile.pairId);
              const isWrong = wrongPair?.includes(tile.key) ?? false;
              const isPicked = first?.key === tile.key;

              let tileClasses =
                "border-[#17201d]/12 bg-white hover:border-[#17201d]/35 hover:-translate-y-0.5";

              if (isPicked) {
                tileClasses = "border-[#17201d] bg-[#d8f36a]";
              } else if (isWrong) {
                tileClasses = "border-[#ef5f47] bg-[#ffefeb] shake-once";
              } else if (isMatched) {
                tileClasses =
                  "border-[#3e9b57]/40 bg-[#e9f7ee] opacity-70 pointer-events-none";
              }

              return (
                <motion.button
                  type="button"
                  key={tile.key}
                  layout
                  onClick={() => handleTileClick(tile)}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`flex min-h-[92px] items-center justify-center rounded-2xl border-2 p-3 text-center text-xs font-bold leading-snug transition-all ${tileClasses} ${
                    tile.kind === "term"
                      ? "text-[#17201d]"
                      : "text-[#3f4a43]"
                  }`}
                >
                  {tile.label}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
