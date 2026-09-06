import { motion } from "framer-motion";
import { RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Progress } from "@/components/ui/progress";
import type { Flashcard, FlashcardStatus } from "../../types/study";

const STATUS_LABELS: Record<FlashcardStatus, string> = {
  learning: "Still learning",
  gotit: "Got it",
  retry: "Review again",
};

interface Props {
  materialId: Id<"materials">;
  flashcards: Flashcard[];
}

export default function FlashcardDeck({ materialId, flashcards }: Props) {
  const statuses = useQuery(api.materials.getFlashcardStatus, { materialId });
  const setStatus = useMutation(api.materials.setFlashcardStatus);

  // Shuffle once on mount so repeats aren't the same order.
  const [deck] = useState<Flashcard[]>(() => {
    const copy = [...flashcards];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  });

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [deckComplete, setDeckComplete] = useState(false);

  const card = deck[index];
  const status = card ? (statuses?.[card.id] ?? "learning") : "learning";

  const learntCount = useMemo(
    () => (statuses ? Object.values(statuses).filter((s) => s === "gotit").length : 0),
    [statuses],
  );

  const allDone = learntCount >= flashcards.length;

  if (allDone && !deckComplete) {
    setDeckComplete(true);
  }

  if (deckComplete || (!card && deck.length > 0)) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col items-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-[26px] bg-[#d8f36a]">
          <Sparkles className="h-9 w-9 text-[#17201d]" />
        </div>
        <h2 className="mt-6 text-2xl font-extrabold tracking-[-0.03em] text-[#17201d]">
          You&apos;ve got all {flashcards.length} cards down.
        </h2>
        <p className="mt-2 max-w-sm text-sm text-[#68736c]">
          {learntCount === flashcards.length
            ? "Every card is marked as learned. Nice work!"
            : `${learntCount} of ${flashcards.length} marked as got it. Keep going until it sticks!`}
        </p>
        <button
          type="button"
          onClick={() => { setDeckComplete(false); setIndex(0); }}
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[#17201d]/15 bg-white px-4 py-3 text-sm font-bold text-[#17201d] transition-colors hover:bg-[#f7f8f5]"
        >
          <RotateCcw className="h-4 w-4" /> Review again
        </button>
      </div>
    );
  }

  if (!card) {
    return null;
  }

  const mark = (next: FlashcardStatus) => {
    void setStatus({ materialId, cardId: card.id, status: next });
    setFlipped(false);
    if (index + 1 < deck.length) {
      setIndex(index + 1);
    } else {
      // Finished the deck pass.
      setDeckComplete(true);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center">
      <div className="mb-4 flex w-full items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#87908a]">
          {index + 1} of {deck.length}
        </span>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#17201d]" />
          <span className="text-xs font-bold text-[#17201d]">
            {learntCount} / {flashcards.length} got it
          </span>
        </div>
      </div>
      <Progress value={(learntCount / flashcards.length) * 100} className="mb-6 h-2" />

      {/* Card */}
      <div className="h-[280px] w-full [perspective:1200px] sm:h-[300px]">
        <motion.div
          className="relative h-full w-full [transform-style:preserve-3d]"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          onClick={() => setFlipped((f) => !f)}
        >
          {/* Front */}
          <div className="absolute inset-0 flex flex-col rounded-[26px] border border-[#17201d]/10 bg-white p-7 shadow-[0_10px_30px_rgba(23,32,29,0.08)] [backface-visibility:hidden]">
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#ef5f47]">Question</span>
            <p className="mt-4 flex-1 text-xl font-extrabold leading-snug tracking-[-0.02em] text-[#17201d]">
              {card.front}
            </p>
            <span className="mt-4 text-xs font-bold text-[#87908a]">Tap to flip</span>
          </div>

          {/* Back */}
          <div className="absolute inset-0 flex flex-col rounded-[26px] bg-[#17201d] p-7 text-white shadow-[0_10px_30px_rgba(23,32,29,0.2)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#d8f36a]">Answer</span>
            <p className="mt-4 flex-1 overflow-y-auto text-lg font-extrabold leading-snug tracking-[-0.02em]">
              {card.back}
            </p>
            {card.hint ? <span className="mt-3 text-xs font-bold text-white/50">Hint: {card.hint}</span> : null}
          </div>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="mt-7 flex w-full flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setFlipped(false)}
          className="inline-flex items-center gap-2 rounded-xl border border-[#17201d]/15 bg-white px-4 py-3 text-sm font-bold text-[#68736c] transition-colors hover:text-[#17201d]"
        >
          <RotateCcw className="h-4 w-4" /> Flip back
        </button>
      </div>

      {flipped && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex w-full flex-wrap items-center justify-center gap-3"
        >
          <button
            type="button"
            onClick={() => mark("gotit")}
            className="inline-flex items-center gap-2 rounded-xl bg-[#d8f36a] px-4 py-3 text-sm font-bold text-[#17201d] shadow-[0_3px_0_#b7d94a] transition-transform hover:-translate-y-0.5"
          >
            <Sparkles className="h-4 w-4" /> Got it
          </button>
          <button
            type="button"
            onClick={() => mark("learning")}
            className="inline-flex items-center gap-2 rounded-xl bg-[#ff967f] px-4 py-3 text-sm font-bold text-[#17201d] shadow-[0_3px_0_#e06a4e] transition-transform hover:-translate-y-0.5"
          >
            Still learning
          </button>
        </motion.div>
      )}

      {/* Deck progress recap */}
      <p className="mt-6 text-center text-xs font-bold text-[#87908a]">
        {status === "gotit" ? "Nice, that one's in the bag." : "Round and round until it sticks."}
      </p>
      <p className="mt-1 text-center text-[11px] text-[#87908a]">
        Marked: {STATUS_LABELS[status]} · loops after the deck ends
      </p>
    </div>
  );
}