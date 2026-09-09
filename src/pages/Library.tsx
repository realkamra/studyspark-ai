import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  FileText,
  Layers3,
  Search,
  Video,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import logo from "@/assets/logo.svg";
import {
  getAllLibraryItems,
  type LearningFormat,
  type LearningItem,
} from "@/lib/library-data";

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

function ResourceCard({
  item,
  index,
  reduceMotion,
  onOpen,
}: {
  item: LearningItem;
  index: number;
  reduceMotion: boolean | null;
  onOpen: () => void;
}) {
  const Icon = formatIcons[item.format];

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: reduceMotion ? 0 : index * 0.04, duration: 0.35 }}
      className="group flex min-h-[276px] flex-col rounded-[22px] border border-slate-200 bg-white p-5 text-left transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-primary text-white">
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </span>
        <span className="border-b border-primary pb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          {item.format}
        </span>
      </div>

      <div className="mt-auto">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
          {item.category}
        </p>
        <h2 className="mt-2 text-xl font-semibold leading-[1.05] tracking-[-0.04em] text-navy-ink">
          {item.title}
        </h2>
        <p className="mt-3 line-clamp-2 text-sm leading-5 text-slate-600">
          {item.description}
        </p>
        <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4 text-xs font-semibold text-slate-500">
          <span>{item.duration}</span>
          <ArrowRight
            className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1"
            strokeWidth={1.8}
          />
        </div>
      </div>
    </motion.button>
  );
}

export default function Library() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All topics");
  const items = getAllLibraryItems();
  const categories = [
    "All topics",
    ...Array.from(new Set(items.map((item) => item.category))),
  ];
  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCategory =
        category === "All topics" || item.category === category;
      const matchesQuery =
        !normalizedQuery ||
        `${item.title} ${item.description} ${item.category}`
          .toLowerCase()
          .includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [category, items, query]);

  return (
    <main className="min-h-screen bg-white text-navy-ink selection:bg-primary selection:text-white">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
          <BrandMark onClick={() => navigate("/")} />
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              onClick={() => navigate("/auth?returnTo=/dashboard")}
              className="rounded-[10px] px-2 py-2 text-sm font-semibold text-slate-500 transition-colors hover:text-navy-ink pressable focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4"
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => navigate("/auth?returnTo=/dashboard")}
              className="inline-flex items-center gap-2 rounded-[12px] bg-primary px-3.5 py-2.5 text-sm font-semibold text-white pressable hover:shadow-lg hover:shadow-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Open workspace
              <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1240px] px-5 pb-10 pt-12 sm:px-8 lg:px-10 lg:pb-14 lg:pt-16">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-8 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition-colors hover:text-navy-ink pressable focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
          Back home
        </button>

        <div className="grid gap-8 lg:grid-cols-[1fr_0.55fr] lg:items-end">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              The learning library
            </p>
            <h1 className="max-w-[700px] text-[clamp(3rem,7vw,5.8rem)] font-semibold leading-[0.9] tracking-[-0.075em] text-navy-ink">
              Find a clearer way in.
            </h1>
          </div>
          <p className="max-w-[340px] text-sm leading-6 text-slate-600">
            Browse guides, short lessons, and practice material for the ideas you want to understand next.
          </p>
        </div>

        <div className="mt-10 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <label className="relative block">
            <span className="sr-only">Search the library</span>
            <Search
              className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              strokeWidth={1.8}
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search topics, skills, or ideas"
              className="h-12 w-full rounded-[12px] border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-navy-ink outline-none transition-[border-color,box-shadow] placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Filter by topic">
            {categories.map((itemCategory) => (
              <button
                type="button"
                key={itemCategory}
                onClick={() => setCategory(itemCategory)}
                className={`whitespace-nowrap rounded-[10px] border px-4 py-3 text-xs font-semibold transition-colors pressable focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  category === itemCategory
                    ? "border-primary bg-primary text-white"
                    : "border-slate-200 bg-white text-slate-500 hover:border-primary/45 hover:text-primary"
                }`}>
                {itemCategory}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 pb-20 sm:px-8 lg:px-10 lg:pb-28">
        <div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-4">
          <p className="text-sm font-semibold text-slate-500">
            {filteredItems.length} {filteredItems.length === 1 ? "resource" : "resources"}
          </p>
          <p className="hidden text-xs font-medium text-slate-400 sm:block">
            Select a resource to see its shape.
          </p>
        </div>

        {filteredItems.length ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item, index) => (
              <ResourceCard
                key={item.id}
                item={item}
                index={index}
                reduceMotion={reduceMotion}
                onOpen={() => navigate(`/library/${item.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50 px-6 py-16 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-primary" strokeWidth={1.8} />
            <h2 className="mt-4 text-xl font-semibold tracking-[-0.03em] text-navy-ink">
              No resources match that search.
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Try a broader phrase or choose another topic.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCategory("All topics");
              }}
              className="mt-6 rounded-[10px] border border-slate-200 px-4 py-2.5 text-sm font-semibold text-navy-ink transition-colors hover:border-primary hover:text-primary pressable focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Clear filters
            </button>
          </div>
        )}
      </section>
    </main>
  );
}