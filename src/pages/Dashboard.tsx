import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BookOpen, FileText, FilePlus2, FolderOpen, LayoutDashboard, Library, LogOut, Plus, Search, Sparkles, Video } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import logo from "@/assets/logo.svg";
import { getAllLibraryItems, type LearningItem } from "@/lib/library-data";
import { useAuth } from "@/hooks/use-auth";

const formatIcons = { Guide: FileText, Video, Flashcards: BookOpen };
const accentClasses: Record<string, string> = {
  sage: "bg-[#D1FAE5] text-[#065F46]",
  coral: "bg-[#FEF3C7] text-[#92400E]",
  slate: "bg-[#E2E8F0] text-[#1E293B]",
  mint: "bg-[#D1FAE5] text-[#065F46]",
};

const navItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "library", label: "Explore library", icon: Library },
  { id: "uploads", label: "My materials", icon: FolderOpen },
] as const;

type WorkspaceView = "overview" | "library" | "uploads";

const FEATURE_LABELS: Record<string, string> = {
  guide: "Guide",
  flashcards: "Flashcards",
  quiz: "Practice test",
  gamePairs: "Game",
};

// Structural view of one row from api.materials.listMaterials (kept in sync
// with the projection in src/convex/materials.ts).
interface MaterialListItem {
  _id: Id<"materials">;
  title: string;
  accent: string;
  sourceType: "text" | "file";
  generatedAt?: number;
  generationStatus: "queued" | "generating" | "ready" | "error";
  features: string[];
}

const interactive =
  "transition-[color,background-color,border-color,box-shadow,opacity,transform] duration-200 ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2 pressable";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<WorkspaceView>("overview");
  const [query, setQuery] = useState("");
  const materials = useQuery(api.materials.listMaterials);

  const allItems = getAllLibraryItems();
  const recentItems = allItems.slice(0, 3);
  const filteredItems = useMemo(
    () => allItems.filter((item) => `${item.title} ${item.category}`.toLowerCase().includes(query.toLowerCase())),
    [allItems, query],
  );

  const myMaterials = materials ?? [];
  const ownedCount = myMaterials.length;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const goNew = () => navigate("/dashboard/new");
  const goMaterial = (id: Id<"materials">) => navigate(`/dashboard/materials/${id}`);

  return (
    <main className="min-h-dvh bg-white text-navy-ink selection:bg-primary selection:text-white">
      <div className="flex min-h-dvh">
        <aside className="hidden w-[248px] shrink-0 border-r border-slate-200 bg-slate-50 p-6 lg:flex lg:flex-col">
          <button
            type="button"
            onClick={() => navigate("/")}
            className={`${interactive} flex items-center gap-3 rounded-lg px-1 text-left`}
          >
            <img src={logo} alt="Gratter mark" className="h-9 w-9 rounded-[10px] bg-navy-ink" />
            <span className="text-[17px] font-extrabold tracking-[-0.04em] text-navy-ink">
              Gratter
            </span>
          </button>

          <div className="mt-14 space-y-1">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                type="button"
                key={id}
                onClick={() => setView(id)}
                className={`${interactive} flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold ${
                  view === id
                    ? "bg-primary text-white"
                    : "text-slate-500 hover:bg-slate-100 hover:text-navy-ink"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={1.8} />
                {label}
              </button>
            ))}
          </div>

          <div className="mt-auto border-t border-slate-200 pt-6">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </span>
              <p className="mt-4 text-sm font-bold leading-5 text-navy-ink">Paste your notes. Get a full study kit.</p>
              <button
                type="button"
                onClick={goNew}
                className={`${interactive} mt-4 text-xs font-bold text-primary underline decoration-primary/35 underline-offset-4 hover:decoration-primary`}
              >
                Make a study kit
              </button>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-20">
            <div className="flex items-center justify-between px-5 py-4 sm:px-8">
              <button
                type="button"
                onClick={() => navigate("/")}
                className={`${interactive} flex items-center gap-3 rounded-lg lg:hidden`}
              >
                <img src={logo} alt="Gratter mark" className="h-8 w-8 rounded-[9px] bg-navy-ink" />
                <span className="text-[17px] font-extrabold tracking-[-0.04em] text-navy-ink">
                  Gratter
                </span>
              </button>
              <div className="hidden text-sm font-semibold text-slate-500 lg:block">
                {view === "overview" ? "Your learning space" : view === "library" ? "Explore the library" : "Your materials"}
              </div>
              <div className="ml-auto flex items-center gap-3">
                <span className="hidden text-right sm:block">
                  <span className="block text-sm font-bold text-navy-ink">{user?.name || "Learning partner"}</span>
                  <span className="block text-xs text-slate-500">Personal workspace</span>
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  aria-label="Sign out"
                  className={`${interactive} flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-navy-ink`}
                >
                  <LogOut className="h-4 w-4" strokeWidth={1.8} />
                </button>
              </div>
            </div>
            <nav aria-label="Workspace sections" className="flex gap-1 overflow-x-auto border-t border-slate-200 px-5 py-2 lg:hidden">
              {navItems.map(({ id, label }) => (
                <button
                  type="button"
                  key={id}
                  onClick={() => setView(id)}
                  className={`${interactive} whitespace-nowrap rounded-md px-3 py-2 text-xs font-bold ${
                    view === id ? "bg-primary text-white" : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </header>

          <div className="mx-auto max-w-[1180px] px-5 py-9 sm:px-8 lg:px-10 lg:py-14">
            <div className="mb-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                  {view === "overview" ? "Good to see you" : view === "library" ? "Curated for curious people" : "Your corner of the library"}
                </p>
                <h1 className="max-w-[620px] text-4xl font-extrabold leading-[0.98] tracking-[-0.065em] sm:text-5xl lg:text-[3.5rem] text-navy-ink">
                  {view === "overview" ? (
                    <>What are we<br />making clearer?</>
                  ) : view === "library" ? (
                    <>Find something<br />worth knowing.</>
                  ) : (
                    <>Your ideas,<br />organized.</>
                  )}
                </h1>
              </div>
              <button
                type="button"
                onClick={goNew}
                className={`${interactive} inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white shadow-[0_3px_0_rgba(37,99,235,0.3)] hover:bg-blue-700 active:scale-[0.97]`}
              >
                <Plus className="h-4 w-4" strokeWidth={2} /> Add resource
              </button>
            </div>

            {view === "overview" && (
              <>
                <section className="grid gap-4 md:grid-cols-[1.5fr_0.8fr]">
                  <div className="relative overflow-hidden rounded-2xl bg-navy-ink p-6 text-white sm:p-7">
                    <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full border border-white/12" aria-hidden="true" />
                    <div className="relative flex items-start justify-between gap-5">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/55">Start here</p>
                        <h2 className="mt-3 max-w-[390px] text-2xl font-extrabold leading-[1.05] tracking-[-0.04em] sm:text-[1.75rem]">
                          Drop in your class notes and get a study guide, flashcards, and more.
                        </h2>
                      </div>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
                        <FilePlus2 className="h-5 w-5" />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={goNew}
                      className={`${interactive} relative mt-10 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-bold text-navy-ink hover:bg-slate-100`}
                    >
                      Make a study kit <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Your library</p>
                    <p className="mt-4 text-5xl font-extrabold tracking-[-0.07em] tabular-nums text-navy-ink">{ownedCount}</p>
                    <p className="mt-1 text-sm text-slate-500">personal resources</p>
                    <button
                      type="button"
                      onClick={() => setView("uploads")}
                      className={`${interactive} mt-auto pt-8 text-left text-xs font-bold text-primary hover:text-blue-700`}
                    >
                      View my materials <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
                    </button>
                  </div>
                </section>

                <section className="mt-12">
                  <div className="mb-5 flex items-end justify-between gap-4 border-b border-slate-200 pb-4">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Keep exploring</p>
                      <h2 className="mt-1 text-xl font-extrabold tracking-[-0.03em] text-navy-ink">Popular right now</h2>
                    </div>
                    <button type="button" onClick={() => setView("library")} className={`${interactive} text-xs font-bold text-primary hover:text-blue-700`}>
                      See all <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
                    </button>
                  </div>
                  <LibraryCardGrid items={recentItems} onOpen={(id) => navigate(`/library/${id}`)} />
                </section>
              </>
            )}

            {view === "library" && (
              <>
                <div className="relative mb-7">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" strokeWidth={1.8} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search the library..."
                    aria-label="Search the library"
                    className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-navy-ink outline-none placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <LibraryCardGrid items={filteredItems} onOpen={(id) => navigate(`/library/${id}`)} />
              </>
            )}

            {view === "uploads" && (
              <>
                <div className="mb-7 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 sm:p-8">
                  <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
                    <div>
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Sparkles className="h-4 w-4" />
                      </span>
                      <h2 className="mt-4 text-xl font-extrabold tracking-[-0.03em] text-navy-ink">Bring your own material</h2>
                      <p className="mt-2 max-w-[500px] text-sm leading-6 text-slate-600">
                        Paste notes or drop a file. Gratter turns it into a guide, flashcards, and more.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={goNew}
                      className={`${interactive} inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-blue-700`}
                    >
                      <Plus className="h-4 w-4" /> New study kit
                    </button>
                  </div>
                </div>

                {materials === undefined ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-label="Loading materials">
                    {[0, 1, 2].map((item) => <MaterialSkeleton key={item} />)}
                  </div>
                ) : myMaterials.length ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {myMaterials.map((item, index) => (
                      <MaterialCard key={item._id} index={index} item={item} onOpen={goMaterial} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-16 text-center">
                    <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FolderOpen className="h-5 w-5" />
                    </span>
                    <h2 className="mt-5 text-xl font-extrabold tracking-[-0.03em] text-navy-ink">Your materials will live here</h2>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                      Add your first notes and get a full study kit in about a minute.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function MaterialSkeleton() {
  return (
    <div className="min-h-[220px] animate-pulse rounded-2xl border border-slate-200 bg-slate-100 p-5" aria-hidden="true">
      <div className="h-10 w-10 rounded-lg bg-slate-200" />
      <div className="mt-24 h-3 w-20 rounded bg-slate-200" />
      <div className="mt-3 h-5 w-3/4 rounded bg-slate-200" />
    </div>
  );
}

function MaterialCard({
  item,
  index,
  onOpen,
}: {
  item: MaterialListItem;
  index: number;
  onOpen: (id: Id<"materials">) => void;
}) {
  const reduceMotion = useReducedMotion();
  const accent = (item.accent ?? "sage") as keyof typeof accentClasses;
  const status = item.generationStatus;
  return (
    <motion.button
      type="button"
      key={item._id}
      onClick={() => onOpen(item._id)}
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.35, delay: index * 0.05 }}
      className={`${interactive} group flex min-h-[220px] flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left hover:border-slate-300 hover:shadow-xl`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${accentClasses[accent]}`}>
          <FileText className="h-5 w-5" strokeWidth={1.8} />
        </span>
        <span className="text-right text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
          {status === "ready" ? "Ready to study" : status === "error" ? "Needs another try" : "Cooking…"}
        </span>
      </div>
      <div className="mt-auto">
        <p className="text-xs font-bold text-primary">{item.sourceType === "file" ? "Uploaded file" : "Your notes"}</p>
        <h3 className="mt-2 text-lg font-extrabold leading-[1.08] tracking-[-0.035em] text-navy-ink">{item.title}</h3>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {item.features.length ? (
            item.features.map((feature) => (
              <span key={feature} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-600">
                {FEATURE_LABELS[feature] ?? feature}
              </span>
            ))
          ) : (
            <span className="text-xs font-bold text-slate-500">{status === "ready" ? "Ready to generate" : "Generating your kit…"}</span>
          )}
        </div>
      </div>
    </motion.button>
  );
}

function LibraryCardGrid({ items, onOpen }: { items: LearningItem[]; onOpen: (id: string) => void }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item, index) => {
        const Icon = formatIcons[item.format];
        return (
          <LibraryCard key={item.id} item={item} index={index} Icon={Icon} onOpen={onOpen} />
        );
      })}
    </div>
  );
}

function LibraryCard({
  item,
  index,
  Icon,
  onOpen,
}: {
  item: LearningItem;
  index: number;
  Icon: typeof FileText;
  onOpen: (id: string) => void;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.button
      type="button"
      onClick={() => onOpen(item.id)}
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.35, delay: index * 0.05 }}
      className={`${interactive} group flex min-h-[250px] flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left hover:border-slate-300 hover:shadow-xl`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </span>
        <span className="rounded-md border border-slate-200 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{item.format}</span>
      </div>
      <div className="mt-auto">
        <p className="text-xs font-bold text-primary">{item.category}</p>
        <h3 className="mt-2 text-lg font-extrabold leading-[1.08] tracking-[-0.035em] text-navy-ink">{item.title}</h3>
        <p className="mt-3 line-clamp-2 text-sm leading-5 text-slate-600">{item.description}</p>
        <div className="mt-5 flex items-center justify-between text-xs font-bold text-slate-500">
          <span>{item.duration}</span>
          <ArrowRight className="h-4 w-4 text-primary transition-transform duration-200 group-hover:translate-x-0.5" />
        </div>
      </div>
    </motion.button>
  );
}