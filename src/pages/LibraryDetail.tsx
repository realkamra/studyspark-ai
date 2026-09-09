import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleCheck,
  FileText,
  Layers3,
  Play,
  Video,
} from "lucide-react";
import { useNavigate, useParams } from "react-router";
import logo from "@/assets/logo.svg";
import { getAllLibraryItems, type LearningFormat } from "@/lib/library-data";

const formatIcons: Record<LearningFormat, typeof FileText> = {
  Guide: FileText,
  Video,
  Flashcards: Layers3,
};

function BrandMark({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 pressable"
    >
      <div className="flex items-center justify-center h-8 w-8 rounded-[10px] bg-navy-ink">
        <span className="flex h-3 w-3 rounded-full bg-mint-500" aria-hidden="true" />
      </div>
      <span className="text-xl font-semibold tracking-tight text-navy-ink">
        Gratter
      </span>
    </button>
  );
}

function MissingResource({ onBack }: { onBack: () => void }) {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-white px-5 text-center text-navy-ink">
      <div className="max-w-md">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Library
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-navy-ink">
          That resource is not available.
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Return to the library to choose another way in.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-6 inline-flex items-center gap-2 rounded-[12px] bg-primary px-4 py-3 text-sm font-semibold text-white pressable hover:shadow-lg hover:shadow-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
          Back to library
        </button>
      </div>
    </main>
  );
}

export default function LibraryDetail() {
  const navigate = useNavigate();
  const { itemId } = useParams();
  const reduceMotion = useReducedMotion();
  const item = getAllLibraryItems().find((entry) => entry.id === itemId);

  if (!item) {
    return <MissingResource onBack={() => navigate("/library")} />;
  }

  const Icon = formatIcons[item.format];

  return (
    <main className="min-h-[100dvh] bg-white text-navy-ink selection:bg-primary selection:text-white">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
          <BrandMark onClick={() => navigate("/")} />
          <button
            type="button"
            onClick={() => navigate("/auth?returnTo=/dashboard")}
            className="inline-flex items-center gap-2 rounded-[12px] bg-primary px-4 py-2.5 text-sm font-semibold text-white pressable hover:shadow-lg hover:shadow-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Open workspace
            <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-[1100px] px-5 pb-24 pt-10 sm:px-8 lg:px-10 lg:pt-16">
        <button
          type="button"
          onClick={() => navigate("/library")}
          className="mb-12 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition-colors hover:text-navy-ink pressable focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
          Back to library
        </button>

        <div className="grid gap-12 lg:grid-cols-[0.84fr_1.16fr] lg:items-start lg:gap-16">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-primary text-white">
              <Icon className="h-6 w-6" strokeWidth={1.8} />
            </div>
            <p className="mt-7 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              {item.category}
            </p>
            <h1 className="mt-3 text-[clamp(2.9rem,6vw,5.3rem)] font-semibold leading-[0.9] tracking-[-0.075em] text-navy-ink">
              {item.title}
            </h1>
            <p className="mt-6 max-w-[32rem] text-base leading-7 text-slate-600">
              {item.description}
            </p>

            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">
              <span>{item.format}</span>
              <span>{item.duration}</span>
              <span>By {item.publishedBy}</span>
            </div>

            <button
              type="button"
              onClick={() => navigate("/auth?returnTo=/dashboard")}
              className="mt-9 inline-flex items-center gap-2 rounded-[12px] bg-primary px-5 py-3.5 text-sm font-semibold text-white pressable hover:shadow-lg hover:shadow-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Save to workspace
              <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
            </button>
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: reduceMotion ? 0 : 0.08, ease: [0.23, 1, 0.32, 1] }}
            className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] sm:p-7"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  Preview
                </p>
                <p className="mt-1 font-semibold text-navy-ink">A useful first pass</p>
              </div>
              <Icon className="h-5 w-5 text-primary" strokeWidth={1.8} />
            </div>

            <div className="py-7">
              {item.format === "Video" ? (
                <div className="relative flex min-h-[280px] items-center justify-center overflow-hidden rounded-[18px] bg-navy-ink">
                  <div className="absolute right-[-2.5rem] top-[-3rem] h-40 w-40 rounded-full border-[24px] border-primary/40" aria-hidden="true" />
                  <button
                    type="button"
                    onClick={() => navigate("/auth?returnTo=/dashboard")}
                    aria-label="Open this video in your workspace"
                    className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white text-navy-ink transition-transform hover:scale-105 pressable focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-navy-ink"
                  >
                    <Play className="ml-1 h-5 w-5 fill-current" strokeWidth={1.8} />
                  </button>
                </div>
              ) : (
                <div className="rounded-[18px] border border-slate-200 bg-white p-5">
                  <p className="text-sm font-semibold leading-6 text-navy-ink">
                    The short version: organize the central idea first, then use the details to make it easier to recall.
                  </p>
                  <div className="mt-5 space-y-3 text-sm text-slate-600">
                    <div className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
                      Start with the idea, not the jargon.
                    </div>
                    <div className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
                      Use an example you recognize.
                    </div>
                    <div className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
                      Practice recalling it, not only rereading it.
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 border-t border-slate-200 pt-5 text-xs font-semibold text-slate-500">
              <CircleCheck className="h-4 w-4 text-primary" strokeWidth={1.8} />
              Designed to be useful in one sitting
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}