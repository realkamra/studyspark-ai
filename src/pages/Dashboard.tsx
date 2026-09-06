import { motion } from "framer-motion";
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
  lime: "bg-[#d8f36a]",
  coral: "bg-[#ff967f]",
  blue: "bg-[#9eb8ff]",
};

type WorkspaceView = "overview" | "library" | "uploads";

const FEATURE_LABELS: Record<string, string> = {
  guide: "Guide",
  flashcards: "Flashcards",
  quiz: "Practice test",
  gamePairs: "Game",
};

// Design tokens (matching index.css)
const TRANSITION = "150ms cubic-bezier(0.23, 1, 0.32, 1)";
const PRESS_SCALE = 0.97;

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
    <main className="min-h-screen bg-[#f7f8f5] text-[#17201d]">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-[238px] shrink-0 border-r border-[#17201d]/10 bg-white p-5 lg:flex lg:flex-col">
          <button type="button" onClick={() => navigate("/")} className="flex items-center gap-2.5 px-2">
            <img src={logo} alt="Notefox mark" className="h-8 w-8 rounded-[9px] bg-[#17201d]" />
            <span className="text-[17px] font-extrabold tracking-[-0.03em]">
              notefox<span className="text-[#ef5f47]">.</span>
            </span>
          </button>

          <div className="mt-12 space-y-1">
            {[
              { id: "overview", label: "Overview", icon: LayoutDashboard },
              { id: "library", label: "Explore library", icon: Library },
              { id: "uploads", label: "My materials", icon: FolderOpen },
            ].map(({ id, label, icon: Icon }) => (
              <button
                type="button"
                key={id}
                onClick={() => setView(id as WorkspaceView)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition-colors pressable ${
                  view === id ? "bg-[#17201d] text-white" : "text-[#68736c] hover:bg-[#f7f8f5] hover:text-[#17201d]"
                }`}
                style={{ transition: TRANSITION }}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          <div className="mt-auto rounded-2xl bg-[#d8f36a] p-4">
            <Sparkles className="h-5 w-5" />
            <p className="mt-3 text-sm font-extrabold leading-5">Paste your notes — get a full study kit.</p>
            <button type="button" onClick={goNew} className="mt-4 text-xs font-bold underline underline-offset-4 pressable" style={{ transition: TRANSITION }}>
              Make a study kit
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="min-w-0 flex-1">
          <header className="flex items-center justify-between border-b border-[#17201d]/10 bg-white px-5 py-4 sm:px-8">
            <button type="button" onClick={() => navigate("/")} className="flex items-center gap-2.5 lg:hidden">
              <img src={logo} alt="Notefox mark" className="h-8 w-8 rounded-[9px] bg-[#17201d]" />
              <span className="text-[17px] font-extrabold">
                notefox<span className="text-[#ef5f47]">.</span>
              </span>
            </button>
            <div className="hidden text-sm font-bold text-[#68736c] lg:block">
              {view === "overview" ? "Your learning space" : view === "library" ? "Explore the library" : "Your materials"}
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden text-right sm:block">
                <span className="block text-sm font-bold">{user?.name || "Learning partner"}</span>
                <span className="block text-xs text-[#87908a]">Personal workspace</span>
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                aria-label="Sign out"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#17201d]/10 text-[#68736c] transition-colors hover:bg-[#f7f8f5] hover:text-[#17201d] pressable"
                style={{ transition: TRANSITION }}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </header>

          <div className="mx-auto max-w-[1180px] px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
            <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[#ef5f47]">
                  {view === "overview"
                    ? "Good to see you"
                    : view === "library"
                      ? "Curated for curious people"
                      : "Your corner of the library"}
                </p>
                <h1 className="text-4xl font-extrabold leading-[0.98] tracking-[-0.055em] sm:text-5xl">
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
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#17201d] px-4 py-3 text-sm font-bold text-white shadow-[0_3px_0_#0c100e] pressable"
                style={{ transition: TRANSITION }}
              >
                <Plus className="h-4 w-4" /> Add resource
              </button>
            </div>

            {view === "overview" && (
              <>
                <section className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-[22px] bg-[#17201d] p-5 text-white md:col-span-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/50">Start here</p>
                        <h2 className="mt-2 max-w-[330px] text-2xl font-extrabold leading-[1.05]">
                          Drop in your class notes and get a study guide, flashcards, and more.
                        </h2>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d8f36a] text-[#17201d]">
                        <FilePlus2 className="h-5 w-5" />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={goNew}
                      className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#17201d] pressable"
                      style={{ transition: TRANSITION }}
                    >
                      Make a study kit <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="rounded-[22px] border border-[#17201d]/10 bg-white p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#87908a]">Your library</p>
                    <p className="mt-3 text-4xl font-extrabold tracking-[-0.05em]">{ownedCount}</p>
                    <p className="mt-1 text-sm text-[#68736c]">personal resources</p>
                    <button
                      type="button"
                      onClick={() => setView("uploads")}
                      className="mt-7 text-xs font-bold text-[#ef5f47] pressable"
                      style={{ transition: TRANSITION }}
                    >
                      View my materials <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
                    </button>
                  </div>
                </section>

                <section className="mt-10">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#87908a]">Keep exploring</p>
                      <h2 className="mt-1 text-xl font-extrabold">Popular right now</h2>
                    </div>
                    <button type="button" onClick={() => setView("library")} className="text-xs font-bold text-[#ef5f47] pressable" style={{ transition: TRANSITION }}>
                      See all <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
                    </button>
                  </div>
                  <LibraryCardGrid items={recentItems} onOpen={(id) => navigate(`/library/${id}`)} />
                </section>
              </>
            )}

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
                <LibraryCardGrid items={filteredItems} onOpen={(id) => navigate(`/library/${id}`)} />
              </>
            )}

            {view === "uploads" && (
              <>
                <div className="mb-6 rounded-[22px] border border-dashed border-[#17201d]/20 bg-white p-6 sm:p-8">
                  <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
                    <div>
                      <Sparkles className="h-6 w-6 text-[#ef5f47]" />
                      <h2 className="mt-3 text-xl font-extrabold">Bring your own material</h2>
                      <p className="mt-1 max-w-[500px] text-sm leading-6 text-[#68736c]">
                        Paste notes or drop a file. StudySpark turns it into a guide, flashcards, and more.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={goNew}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#d8f36a] px-4 py-3 text-sm font-bold pressable"
                      style={{ transition: TRANSITION }}
                    >
                      <Plus className="h-4 w-4" /> New study kit
                    </button>
                  </div>
                </div>

                {materials === undefined ? (
                  <p className="py-12 text-center text-sm text-[#87908a]">Loading your materials…</p>
                ) : myMaterials.length ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {myMaterials.map((item, index) => (
                      <MaterialCard key={item._id} index={index} item={item} onOpen={goMaterial} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[22px] border border-[#17201d]/10 bg-white px-6 py-16 text-center">
                    <FolderOpen className="mx-auto h-8 w-8 text-[#ef5f47]" />
                    <h2 className="mt-4 text-xl font-extrabold">Your materials will live here</h2>
                    <p className="mt-2 text-sm text-[#68736c]">
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

function MaterialCard({
  item,
  index,
  onOpen,
}: {
  item: MaterialListItem;
  index: number;
  onOpen: (id: Id<"materials">) => void;
}) {
  const accent = (item.accent ?? "lime") as keyof typeof accentClasses;
  const status = item.generationStatus;
  return (
    <motion.button
      type="button"
      key={item._id}
      onClick={() => onOpen(item._id)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group flex min-h-[210px] flex-col rounded-[22px] border border-[#17201d]/10 bg-white p-5 text-left hover:-translate-y-1 hover:border-[#17201d]/25 hover:shadow-[0_12px_24px_rgba(23,32,29,0.06)] pressable"
      style={{ transition: TRANSITION }}
    >
      <div className="flex items-start justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${accentClasses[accent]}`}>
          <FileText className="h-5 w-5" />
        </span>
        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#87908a]">
          {status === "ready" ? "Ready to study" : status === "error" ? "Needs another try" : "Cooking…"}
        </span>
      </div>
      <div className="mt-auto">
        <p className="text-xs font-bold text-[#ef5f47]">
          {item.sourceType === "file" ? "Uploaded file" : "Your notes"}
        </p>
        <h3 className="mt-2 text-lg font-extrabold leading-[1.08] tracking-[-0.03em]">{item.title}</h3>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {item.features.length ? (
            item.features.map((feature) => (
              <span
                key={feature}
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${accentClasses[accent]} text-[#17201d]`}
              >
                {FEATURE_LABELS[feature] ?? feature}
              </span>
            ))
          ) : (
            <span className="text-xs font-bold text-[#87908a]">
              {status === "ready" ? "Ready to generate" : "Generating your kit…"}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}

function LibraryCardGrid({ items, onOpen }: { items: LearningItem[]; onOpen: (id: string) => void }) {
  // LearningItem.id is a string, so this stays as string
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item, index) => {
        const Icon = formatIcons[item.format];
        const style = { animationDelay: `${index * 50}ms` } as React.CSSProperties;
        return (
          <motion.button
            type="button"
            key={item.id}
            onClick={() => onOpen(item.id)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="group flex min-h-[235px] flex-col rounded-[22px] border border-[#17201d]/10 bg-white p-5 text-left hover:-translate-y-1 hover:border-[#17201d]/25 hover:shadow-[0_12px_24px_rgba(23,32,29,0.06)] pressable"
          >
            <div className="flex items-start justify-between">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${accentClasses[item.accent]}`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#87908a]">{item.format}</span>
            </div>
            <div className="mt-auto">
              <p className="text-xs font-bold text-[#ef5f47]">{item.category}</p>
              <h3 className="mt-2 text-lg font-extrabold leading-[1.08] tracking-[-0.03em]">{item.title}</h3>
              <p className="mt-2 line-clamp-2 text-sm leading-5 text-[#68736c]">{item.description}</p>
              <div className="mt-4 flex items-center justify-between text-xs font-bold text-[#87908a]">
                <span>{item.duration}</span>
                <ArrowRight className="h-4 w-4 text-[#ef5f47] transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}