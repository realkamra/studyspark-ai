import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleCheck,
  FileText,
  Layers3,
  Play,
  Sparkles,
  Video,
} from "lucide-react";
import { useNavigate, useParams } from "react-router";
import logo from "@/assets/logo.svg";
import { getAllLibraryItems, type LearningFormat } from "@/lib/library-data";

const formatIcons: Record<LearningFormat, typeof FileText> = { Guide: FileText, Video, Flashcards: Layers3 };
const accentClasses = { lime: "bg-[#d8f36a]", coral: "bg-[#ff967f]", blue: "bg-[#9eb8ff]" };

export default function LibraryDetail() {
  const navigate = useNavigate();
  const { itemId } = useParams();
  const item = getAllLibraryItems().find((entry) => entry.id === itemId);

  if (!item) {
    return <main className="flex min-h-screen items-center justify-center bg-[#f7f8f5] px-5 text-center"><div><h1 className="text-3xl font-extrabold">That resource wandered off.</h1><button type="button" onClick={() => navigate("/library")} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#17201d] px-4 py-3 text-sm font-bold text-white"><ArrowLeft className="h-4 w-4" /> Back to library</button></div></main>;
  }

  const Icon = formatIcons[item.format];

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#17201d]">
      <header className="border-b border-[#17201d]/10 bg-white"><div className="mx-auto flex max-w-[1240px] items-center justify-between px-5 py-5 sm:px-8 lg:px-10"><button type="button" onClick={() => navigate("/")} className="flex items-center gap-2.5"><img src={logo} alt="Notefox mark" className="h-8 w-8 rounded-[9px] bg-[#17201d]" /><span className="text-[17px] font-extrabold tracking-[-0.03em]">notefox<span className="text-[#ef5f47]">.</span></span></button><button type="button" onClick={() => navigate("/dashboard")} className="inline-flex items-center gap-2 rounded-xl bg-[#17201d] px-4 py-2.5 text-sm font-bold text-white">Open workspace <ArrowRight className="h-4 w-4" /></button></div></header>
      <section className="mx-auto max-w-[1000px] px-5 pb-24 pt-12 sm:px-8 lg:pt-20"><button type="button" onClick={() => navigate("/library")} className="mb-12 inline-flex items-center gap-2 text-xs font-bold text-[#68736c] hover:text-[#17201d]"><ArrowLeft className="h-4 w-4" /> Back to library</button><div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start"><motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}><div className={`flex h-16 w-16 items-center justify-center rounded-[20px] ${accentClasses[item.accent]}`}><Icon className="h-7 w-7" /></div><p className="mt-7 text-xs font-bold uppercase tracking-[0.14em] text-[#ef5f47]">{item.category}</p><h1 className="mt-3 text-5xl font-extrabold leading-[0.95] tracking-[-0.06em] sm:text-6xl">{item.title}</h1><p className="mt-6 text-base leading-7 text-[#68736c]">{item.description}</p><div className="mt-7 flex flex-wrap gap-2 text-xs font-bold text-[#68736c]"><span className="rounded-full border border-[#17201d]/15 bg-white px-3 py-1.5">{item.format}</span><span className="rounded-full border border-[#17201d]/15 bg-white px-3 py-1.5">{item.duration}</span><span className="rounded-full border border-[#17201d]/15 bg-white px-3 py-1.5">By {item.publishedBy}</span></div><button type="button" onClick={() => navigate("/auth?returnTo=/dashboard")} className="mt-9 inline-flex items-center gap-2 rounded-xl bg-[#17201d] px-5 py-3.5 text-sm font-bold text-white shadow-[0_4px_0_#0c100e] transition-transform hover:-translate-y-0.5">Save to my workspace <ArrowRight className="h-4 w-4" /></button></motion.div><motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-[26px] border border-[#17201d]/10 bg-white p-5 sm:p-7"><div className="flex items-center justify-between border-b border-[#17201d]/10 pb-5"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#87908a]">Preview</p><p className="mt-1 font-extrabold">A little taste before you dive in</p></div><Sparkles className="h-5 w-5 text-[#ef5f47]" /></div><div className="py-7">{item.format === "Video" ? <div className="relative flex min-h-[280px] items-center justify-center overflow-hidden rounded-[19px] bg-[#17201d]"><div className="absolute left-8 top-8 h-24 w-24 rounded-full bg-[#d8f36a]" /><div className="absolute bottom-6 right-5 h-32 w-32 rounded-full border-[25px] border-[#ff7357]" /><button type="button" onClick={() => navigate("/auth?returnTo=/dashboard")} aria-label="Play preview" className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#17201d] transition-transform hover:scale-105"><Play className="ml-1 h-5 w-5 fill-current" /></button></div> : <div className="space-y-4 rounded-[19px] bg-[#fffaf2] p-5"><p className="text-sm font-semibold leading-6">The short version: complex ideas become easier when they are organized around the one thing someone needs to understand next.</p><div className="space-y-2 text-sm text-[#68736c]"><div className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#ef5f47]" /> Start with the idea, not the jargon.</div><div className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#ef5f47]" /> Use an example people recognize.</div><div className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#ef5f47]" /> Practice recalling it, not just rereading it.</div></div></div>}</div><div className="flex items-center gap-2 border-t border-[#17201d]/10 pt-5 text-xs font-bold text-[#68736c]"><CircleCheck className="h-4 w-4 text-[#ef5f47]" /> Designed to be useful in one sitting</div></motion.div></div></section>
    </main>
  );
}
