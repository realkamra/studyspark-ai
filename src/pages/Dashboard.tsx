import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Brain,
  FileText,
  LayoutDashboard,
  Library,
  Link2,
  ListChecks,
  Loader2,
  LogOut,
  Plus,
  Search,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import logo from "@/assets/logo.svg";
import { getAllLibraryItems, type LearningItem } from "@/lib/library-data";
import { useAuth } from "@/hooks/use-auth";
import { FoxMascot, type FoxMood } from "@/components/FoxMascot";

const formatIcons = { Guide: FileText, Video: BookOpen, Flashcards: Brain };
const accentClasses = { lime: "bg-[#d8f36a]", coral: "bg-[#ff967f]", blue: "bg-[#9eb8ff]" };

type WorkspaceView = "create" | "sets" | "library";

const thinkingQuips = [
  "Reading your notes...",
  "Removing the jargon...",
  "Simplifying the tricky bits...",
  "Writing tiny explanations...",
  "Hiding extra flashcards in the yard...",
  "Sharpening pencils...",
];

const SAMPLE_NOTES = `Mitochondria are organelles found in most eukaryotic cells. They are often called the powerhouse of the cell because they generate most of the cell's supply of ATP, which is used as a source of chemical energy. Mitochondria have their own DNA, separate from the cell's nuclear DNA, which supports the endosymbiotic theory: that mitochondria were once free-living bacteria that were engulfed by early cells. The inner membrane of a mitochondrion is folded into structures called cristae, which increase the surface area available for the electron transport chain. The electron transport chain uses oxygen to produce ATP through oxidative phosphorylation. Cells with high energy demands, like muscle cells, contain many more mitochondria than less active cells.`;

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<WorkspaceView>("create");
  const [query, setQuery] = useState("");
  const [notes, setNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [quipsIndex, setQuipsIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const studySets = useQuery(api.studySets.listMyStudySets) ?? [];
  const generateStudyMaterials = useAction(
    api.studyMaterials.generateStudyMaterials,
  );

  const mood: FoxMood = error
    ? "sad"
    : isGenerating
      ? "thinking"
      : notes.trim().length > 40
        ? "excited"
        : "idle";

  const wordCount = useMemo(
    () => notes.trim().split(/\s+/).filter(Boolean).length,
    [notes],
  );

  useEffect(() => {
    if (!isGenerating) return;
    const timer = window.setInterval(
      () => setQuipsIndex((index) => (index + 1) % thinkingQuips.length),
      2400,
    );
    return () => window.clearInterval(timer);
  }, [isGenerating]);

  const allItems = getAllLibraryItems();
  const filteredItems = useMemo(
    () =>
      allItems.filter((item) =>
        `${item.title} ${item.category}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [allItems, query],
  );

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleGenerate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (notes.trim().length < 40) {
      setError("Give me a little more to work with — at least a few sentences.");
      return;
    }

    setIsGenerating(true);

    try {
      const setId = await generateStudyMaterials({ notes: notes.trim() });
      toast.success("Your study set is ready!", {
        description: "Notes, flashcards, quiz, and a matching game.",
      });
      navigate(`/set/${setId}`);
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Something went wrong. Try again.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#17201d]">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-[238px] shrink-0 border-r border-[#17201d]/10 bg-white p-5 lg:flex lg:flex-col">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2.5 px-2"
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

          <div className="mt-12 space-y-1">
            {[
              { id: "create", label: "Create", icon: WandSparkles },
              { id: "sets", label: "My study sets", icon: LayoutDashboard },
              { id: "library", label: "Explore library", icon: Library },
            ].map(({ id, label, icon: Icon }) => (
              <button
                type="button"
                key={id}
                onClick={() => setView(id as WorkspaceView)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition-colors ${
                  view === id
                    ? "bg-[#17201d] text-white"
                    : "text-[#68736c] hover:bg-[#f7f8f5] hover:text-[#17201d]"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          <div className="mt-auto rounded-2xl bg-[#d8f36a] p-4">
            <FoxMascot mood="idle" size={44} />
            <p className="mt-3 text-sm font-extrabold leading-5">
              Paste anything. I&apos;ll make it make sense.
            </p>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {/* Top bar */}
          <header className="flex items-center justify-between border-b border-[#17201d]/10 bg-white px-5 py-4 sm:px-8">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex items-center gap-2.5 lg:hidden"
            >
              <img
                src={logo}
                alt="Notefox mark"
                className="h-8 w-8 rounded-[9px] bg-[#17201d]"
              />
              <span className="text-[17px] font-extrabold">
                notefox<span className="text-[#ef5f47]">.</span>
              </span>
            </button>

            <div className="hidden text-sm font-bold text-[#68736c] lg:block">
              {view === "create"
                ? "Your learning space"
                : view === "sets"
                  ? "Your study sets"
                  : "Explore the library"}
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden text-right sm:block">
                <span className="block text-sm font-bold">
                  {user?.name || "Learning partner"}
                </span>
                <span className="block text-xs text-[#87908a]">
                  Personal workspace
                </span>
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                aria-label="Sign out"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#17201d]/10 text-[#68736c] transition-colors hover:bg-[#f7f8f5] hover:text-[#17201d]"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </header>

          <div className="mx-auto max-w-[1180px] px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
            {/* CREATE VIEW */}
            {view === "create" && (
              <>
                <div className="mb-8">
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[#ef5f47]">
                    Good to see you
                  </p>
                  <h1 className="text-4xl font-extrabold leading-[0.98] tracking-[-0.055em] sm:text-5xl">
                    What are we
                    <br />
                    making clearer?
                  </h1>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
                  <form
                    onSubmit={handleGenerate}
                    className="rounded-[22px] border border-[#17201d]/10 bg-white p-6 sm:p-7"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d8f36a]">
                        <Sparkles className="h-5 w-5" />
                      </span>
                      <div>
                        <h2 className="font-extrabold">Paste your notes</h2>
                        <p className="text-xs text-[#68736c]">
                          Lecture notes, textbook paragraphs, a brain dump —
                          anything.
                        </p>
                      </div>
                    </div>

                    <textarea
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      disabled={isGenerating}
                      placeholder="Paste your notes here. The more the better — but even a few messy paragraphs work."
                      className="mt-5 min-h-[220px] w-full resize-y rounded-2xl border border-[#17201d]/15 bg-[#fffaf2] p-4 text-sm leading-6 outline-none transition-shadow placeholder:text-[#a2aaa5] focus:ring-2 focus:ring-[#d8f36a] disabled:opacity-60"
                    />

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3 text-xs font-bold text-[#87908a]">
                        <span>{wordCount} words</span>
                        <button
                          type="button"
                          onClick={() => setNotes(SAMPLE_NOTES)}
                          disabled={isGenerating}
                          className="text-[#ef5f47] underline underline-offset-4 hover:text-[#c94a34] disabled:opacity-50"
                        >
                          Try an example
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={isGenerating}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#17201d] px-5 py-3 text-sm font-bold text-white shadow-[0_3px_0_#0c100e] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Making it make sense...
                          </>
                        ) : (
                          <>
                            <WandSparkles className="h-4 w-4" />
                            Make it make sense
                          </>
                        )}
                      </button>
                    </div>

                    {error && (
                      <div className="mt-4 flex items-start gap-3 rounded-xl border border-[#ef5f47]/30 bg-[#ffefeb] p-4">
                        <FoxMascot mood="sad" size={40} />
                        <div>
                          <p className="text-sm font-bold">Hmm, that didn&apos;t work.</p>
                          <p className="text-xs leading-5 text-[#68736c]">
                            {error}
                          </p>
                        </div>
                      </div>
                    )}
                  </form>

                  <div className="flex flex-col items-center justify-center rounded-[22px] border border-[#17201d]/10 bg-white p-6 text-center">
                    <FoxMascot mood={mood} size={120} />
                    {isGenerating ? (
                      <p className="mt-5 text-sm font-extrabold">
                        {thinkingQuips[quipsIndex]}
                      </p>
                    ) : (
                      <p className="mt-5 text-sm font-extrabold">
                        {error
                          ? "Not your fault. Really. Try again."
                          : mood === "excited"
                            ? "Ooh, good notes. Hit the button!"
                            : "I'm ready when you are."}
                      </p>
                    )}
                    <p className="mt-2 max-w-[220px] text-xs leading-5 text-[#68736c]">
                      You&apos;ll get clear notes, flashcards, a quiz, and a
                      matching game.
                    </p>
                  </div>
                </div>

                {studySets.length > 0 && (
                  <section className="mt-10">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#87908a]">
                          Fresh from the den
                        </p>
                        <h2 className="mt-1 text-xl font-extrabold">
                          Your latest study sets
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => setView("sets")}
                        className="text-xs font-bold text-[#ef5f47]"
                      >
                        See all <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
                      </button>
                    </div>
                    <StudySetGrid
                      sets={studySets.slice(0, 3)}
                      onOpen={(id) => navigate(`/set/${id}`)}
                    />
                  </section>
                )}
              </>
            )}

            {/* STUDY SETS VIEW */}
            {view === "sets" && (
              <>
                <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[#ef5f47]">
                      Your corner of the library
                    </p>
                    <h1 className="text-4xl font-extrabold leading-[0.98] tracking-[-0.055em] sm:text-5xl">
                      Your ideas,
                      <br />
                      organized.
                    </h1>
                  </div>
                  <button
                    type="button"
                    onClick={() => setView("create")}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#17201d] px-4 py-3 text-sm font-bold text-white shadow-[0_3px_0_#0c100e] transition-transform hover:-translate-y-0.5"
                  >
                    <Plus className="h-4 w-4" /> New study set
                  </button>
                </div>

                {studySets.length ? (
                  <StudySetGrid
                    sets={studySets}
                    onOpen={(id) => navigate(`/set/${id}`)}
                  />
                ) : (
                  <div className="rounded-[22px] border border-[#17201d]/10 bg-white px-6 py-16 text-center">
                    <FoxMascot mood="idle" size={90} className="mx-auto" />
                    <h2 className="mt-4 text-xl font-extrabold">
                      No study sets yet
                    </h2>
                    <p className="mx-auto mt-2 max-w-[320px] text-sm text-[#68736c]">
                      Paste your first set of notes and I&apos;ll turn them into
                      something you can actually study from.
                    </p>
                    <button
                      type="button"
                      onClick={() => setView("create")}
                      className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#d8f36a] px-4 py-3 text-sm font-bold"
                    >
                      <Plus className="h-4 w-4" /> Create your first set
                    </button>
                  </div>
                )}
              </>
            )}

            {/* LIBRARY VIEW */}
            {view === "library" && (
              <>
                <div className="relative mb-6">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#87908a]" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search the library..."
                    className="h-12 w-full rounded-xl border border-[#17201d]/15 bg-white pl-11 pr-4 text-sm outline-none focus:border-[#17201d]/35 focus:ring-2 focus:ring-[#d8f36a]"
                  />
                </div>
                <ResourceGrid
                  items={filteredItems}
                  onOpen={(id) => navigate(`/library/${id}`)}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function StudySetGrid({
  sets,
  onOpen,
}: {
  sets: Array<{
    _id: string;
    title: string;
    createdAt: number;
    sections: unknown[];
    flashcards: unknown[];
    quiz: unknown[];
    matching: { pairs: unknown[] };
  }>;
  onOpen: (id: string) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sets.map((set, index) => (
        <motion.button
          type="button"
          key={set._id}
          onClick={() => onOpen(set._id)}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.04 }}
          className="group flex min-h-[210px] flex-col rounded-[22px] border border-[#17201d]/10 bg-white p-5 text-left transition-all hover:-translate-y-1 hover:border-[#17201d]/25 hover:shadow-[0_12px_24px_rgba(23,32,29,0.06)]"
        >
          <div className="flex items-start justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#9eb8ff]">
              <Brain className="h-5 w-5" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#87908a]">
              {formatDate(set.createdAt)}
            </span>
          </div>

          <div className="mt-auto">
            <h3 className="mt-4 line-clamp-2 text-lg font-extrabold leading-[1.08] tracking-[-0.03em]">
              {set.title}
            </h3>

            <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-bold text-[#68736c]">
              <span className="rounded-full border border-[#17201d]/10 px-2 py-1">
                {set.sections.length} sections
              </span>
              <span className="rounded-full border border-[#17201d]/10 px-2 py-1">
                {set.flashcards.length} cards
              </span>
              <span className="rounded-full border border-[#17201d]/10 px-2 py-1">
                {set.quiz.length} questions
              </span>
              <span className="rounded-full border border-[#17201d]/10 px-2 py-1">
                {set.matching.pairs.length} pairs
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs font-bold text-[#87908a]">
              <span>Open study set</span>
              <ArrowRight className="h-4 w-4 text-[#ef5f47] transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}

function ResourceGrid({
  items,
  onOpen,
}: {
  items: LearningItem[];
  onOpen: (id: string) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item, index) => {
        const Icon = formatIcons[item.format];
        return (
          <motion.button
            type="button"
            key={item.id}
            onClick={() => onOpen(item.id)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="group flex min-h-[235px] flex-col rounded-[22px] border border-[#17201d]/10 bg-white p-5 text-left transition-all hover:-translate-y-1 hover:border-[#17201d]/25 hover:shadow-[0_12px_24px_rgba(23,32,29,0.06)]"
          >
            <div className="flex items-start justify-between">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${accentClasses[item.accent]}`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#87908a]">
                {item.format}
              </span>
            </div>
            <div className="mt-auto">
              <p className="text-xs font-bold text-[#ef5f47]">
                {item.category}
              </p>
              <h3 className="mt-2 text-lg font-extrabold leading-[1.08] tracking-[-0.03em]">
                {item.title}
              </h3>
              <p className="mt-2 line-clamp-2 text-sm leading-5 text-[#68736c]">
                {item.description}
              </p>
              <div className="mt-4 flex items-center justify-between text-xs font-bold text-[#87908a]">
                <span className="flex items-center gap-1.5">
                  <Link2 className="h-3 w-3" />
                  {item.duration}
                </span>
                <span className="flex items-center gap-1.5">
                  <ListChecks className="h-3.5 w-3.5" />
                  Preview
                  <ArrowRight className="h-4 w-4 text-[#ef5f47] transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
