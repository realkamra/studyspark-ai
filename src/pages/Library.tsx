import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  FileText,
  Layers3,
  Search,
  Sparkles,
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

const accentClasses: Record<LearningItem["accent"], string> = {
  lime: "bg-[#d8f36a]",
  coral: "bg-[#ff967f]",
  blue: "bg-[#9eb8ff]",
};

export default function Library() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All topics");
  const items = getAllLibraryItems();
  const categories = ["All topics", ...Array.from(new Set(items.map((item) => item.category)))];
  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCategory = category === "All topics" || item.category === category;
      const matchesQuery = !normalizedQuery || `${item.title} ${item.description} ${item.category}`.toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#17201d]">
      <header className="border-b border-[#17201d]/10 bg-white">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
          <button type="button" onClick={() => navigate("/")} className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17201d] focus-visible:ring-offset-4"><img src={logo} alt="Notefox mark" className="h-8 w-8 rounded-[9px] bg-[#17201d]" /><span className="text-[17px] font-extrabold tracking-[-0.03em]">notefox<span className="text-[#ef5f47]">.</span></span></button>
          <div className="flex items-center gap-2 sm:gap-4"><button type="button" onClick={() => navigate("/auth?returnTo=/dashboard")} className="px-2 py-2 text-sm font-bold text-[#68736c] hover:text-[#17201d]">Log in</button><button type="button" onClick={() => navigate("/auth?returnTo=/dashboard")} className="inline-flex items-center gap-2 rounded-xl bg-[#17201d] px-3.5 py-2.5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 sm:px-4">Create account <ArrowRight className="h-4 w-4" /></button></div>
        </div>
      </header>
      <section className="mx-auto max-w-[1240px] px-5 pb-10 pt-12 sm:px-8 lg:px-10 lg:pb-14 lg:pt-16">
        <button type="button" onClick={() => navigate("/")} className="mb-8 inline-flex items-center gap-2 text-xs font-bold text-[#68736c] hover:text-[#17201d]"><ArrowLeft className="h-4 w-4" /> Back home</button>
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end"><div><p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#ef5f47]"><Sparkles className="h-4 w-4" /> The Notefox library</p><h1 className="max-w-[700px] text-5xl font-extrabold leading-[0.95] tracking-[-0.06em] sm:text-6xl">Find your next<br /><span className="relative inline-block">“oh, I get it.”<span className="absolute bottom-0 left-0 right-0 -z-0 h-3 -rotate-2 rounded-full bg-[#d8f36a]" /></span></h1></div><p className="max-w-[320px] text-sm leading-6 text-[#68736c]">Browse clear guides, illustrated lessons, and quick practice materials made for the way people learn now.</p></div>
        <div className="mt-10 flex flex-col gap-3 md:flex-row"><label className="relative block flex-1"><span className="sr-only">Search the library</span><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#87908a]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search topics, skills, or ideas..." className="h-12 w-full rounded-xl border border-[#17201d]/15 bg-white pl-11 pr-4 text-sm outline-none transition-shadow placeholder:text-[#a2aaa5] focus:border-[#17201d]/35 focus:ring-2 focus:ring-[#d8f36a]" /></label><div className="flex gap-2 overflow-x-auto pb-1">{categories.map((itemCategory) => (<button type="button" key={itemCategory} onClick={() => setCategory(itemCategory)} className={`whitespace-nowrap rounded-xl border px-4 py-3 text-xs font-bold transition-colors ${category === itemCategory ? "border-[#17201d] bg-[#17201d] text-white" : "border-[#17201d]/15 bg-white text-[#68736c] hover:border-[#17201d]/30 hover:text-[#17201d]"}`}>{itemCategory}</button>))}</div></div>
      </section>
      <section className="mx-auto max-w-[1240px] px-5 pb-20 sm:px-8 lg:px-10 lg:pb-28"><div className="mb-5 flex items-center justify-between"><p className="text-sm font-bold text-[#68736c]">{filteredItems.length} resources to explore</p><p className="hidden text-xs font-semibold text-[#a2aaa5] sm:block">New ways to learn, added regularly</p></div>{filteredItems.length ? <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{filteredItems.map((item, index) => { const Icon = formatIcons[item.format]; return (<motion.button type="button" key={item.id} onClick={() => navigate(`/library/${item.id}`)} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="group flex min-h-[270px] flex-col rounded-[24px] border border-[#17201d]/10 bg-white p-5 text-left transition-all hover:-translate-y-1 hover:border-[#17201d]/25 hover:shadow-[0_14px_28px_rgba(23,32,29,0.06)]"><div className="flex items-start justify-between"><span className={`flex h-11 w-11 items-center justify-center rounded-[14px] ${accentClasses[item.accent]}`}><Icon className="h-5 w-5" /></span><span className="rounded-full border border-[#17201d]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#87908a]">{item.format}</span></div><div className="mt-auto"><p className="text-xs font-bold text-[#ef5f47]">{item.category}</p><h2 className="mt-2 text-xl font-extrabold leading-[1.05] tracking-[-0.035em]">{item.title}</h2><p className="mt-3 line-clamp-2 text-sm leading-5 text-[#68736c]">{item.description}</p><div className="mt-5 flex items-center justify-between text-xs font-bold text-[#87908a]"><span>{item.duration}</span><ArrowRight className="h-4 w-4 text-[#ef5f47] transition-transform group-hover:translate-x-1" /></div></div></motion.button>); })}</div> : <div className="rounded-[24px] border border-dashed border-[#17201d]/20 bg-white px-6 py-16 text-center"><BookOpen className="mx-auto h-8 w-8 text-[#ef5f47]" /><h2 className="mt-4 text-xl font-extrabold">Nothing found yet</h2><p className="mt-2 text-sm text-[#68736c]">Try a broader search or choose another topic.</p></div>}</section>
    </main>
  );
}
