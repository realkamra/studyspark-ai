import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  BookOpen,
  GraduationCap,
  PlayCircle,
  Search,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import type { StudyKit } from "../../types/study";

interface Props {
  kit: StudyKit;
  materialTitle: string;
}

function buildSearchUrl(query: string, platform: "youtube" | "google") {
  const encoded = encodeURIComponent(query);
  if (platform === "youtube") {
    return `https://www.youtube.com/results?search_query=${encoded}`;
  }
  return `https://www.google.com/search?q=${encoded}`;
}

function getTopicSuggestions(kit: StudyKit, title: string): string[] {
  const topics = new Set<string>();

  // Add guide section headings as topics
  kit.guide?.sections.forEach((section) => {
    topics.add(section.heading);
  });

  // Add quiz topics
  kit.quiz?.forEach((q) => {
    topics.add(q.topic);
  });

  // Add flashcard fronts as potential topics
  kit.flashcards?.slice(0, 3).forEach((card) => {
    const words = card.front.split(/\s+/).slice(0, 4).join(" ");
    topics.add(words);
  });

  // Add game pairs prompts
  kit.gamePairs?.slice(0, 3).forEach((pair) => {
    topics.add(pair.prompt);
  });

  // Always include the main title
  topics.add(title);

  return Array.from(topics).slice(0, 8);
}

const platformButtons = [
  {
    id: "youtube",
    label: "YouTube",
    icon: PlayCircle,
    description: "Video tutorials & lectures",
    color: "bg-red-500 hover:bg-red-600",
    gradient: "from-red-500 to-red-600",
  },
  {
    id: "google",
    label: "Google",
    icon: Search,
    description: "Articles & documentation",
    color: "bg-primary hover:bg-primary/90",
    gradient: "from-primary to-blue-600",
  },
] as const;

export default function VideoSuggestions({ kit, materialTitle }: Props) {
  const reduceMotion = useReducedMotion();
  const topics = getTopicSuggestions(kit, materialTitle);

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        style={{ animationDuration: reduceMotion ? "0.01ms" : "400ms" }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Video Suggestions
            </p>
            <h2 className="text-2xl font-semibold text-navy-ink">Deepen your understanding</h2>
          </div>
        </div>
        <p className="text-slate-600 max-w-2xl">
          Curated search links for each topic in your study kit. Click to open video tutorials,
          lectures, or articles that reinforce what you're learning.
        </p>
      </motion.div>

      {/* Topic grid */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
        style={{ animationDuration: reduceMotion ? "0.01ms" : "400ms" }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children"
      >
        {topics.map((topic, index) => (
          <motion.div
            key={topic}
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.06, ease: [0.23, 1, 0.32, 1] }}
            style={{ animationDuration: reduceMotion ? "0.01ms" : "400ms" }}
            className="group relative rounded-2xl border border-slate-200 bg-white p-5 transition-[border-color,box-shadow,transform] duration-[var(--duration-normal)] ease-[var(--ease-out)] hover:shadow-xl hover:border-primary/30 hover-lift"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                <GraduationCap className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-navy-ink truncate group-hover:text-primary transition-colors">
                  {topic}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Search for videos & articles</p>
              </div>
            </div>

            <div className="flex gap-3">
              {platformButtons.map((platform) => (
                <a
                  key={platform.id}
                  href={buildSearchUrl(topic, platform.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`pressable flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-white ${platform.color} transition-[box-shadow,background-color,opacity,transform] duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:shadow-md hover:shadow-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
                  aria-label={`Search ${topic} on ${platform.label}`}
                >
                  <platform.icon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                  {platform.label}
                  <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
                </a>
              ))}
            </div>

            {/* Decorative accent */}
            <div className="absolute top-0 right-0 hidden md:block pointer-events-none">
              <div className="translate-x-1/2 -translate-y-1/2 h-24 w-24 rounded-full bg-primary/5 group-hover:bg-primary/10 transition-colors duration-300" aria-hidden="true" />
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Search tips */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
        style={{ animationDuration: reduceMotion ? "0.01ms" : "400ms" }}
        className="mt-10 rounded-xl bg-slate-50 p-6 border border-slate-200"
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Target className="h-4 w-4" strokeWidth={2} />
          </span>
          <h3 className="font-semibold text-navy-ink">Search tips for better results</h3>
        </div>
        <ul className="space-y-2 text-sm text-slate-600">
          <li className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary flex-shrink-0" strokeWidth={2} />
            Add "tutorial", "explained", or "crash course" to find beginner-friendly content
          </li>
          <li className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary flex-shrink-0" strokeWidth={2} />
            Include "examples" or "real world" for practical applications
          </li>
          <li className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary flex-shrink-0" strokeWidth={2} />
            Try "vs" or "comparison" to understand differences between concepts
          </li>
          <li className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary flex-shrink-0" strokeWidth={2} />
            Use quotes for exact phrases: "project management lifecycle"
          </li>
        </ul>
      </motion.div>
    </div>
  );
}