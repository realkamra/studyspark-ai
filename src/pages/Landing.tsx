import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Brain,
  Check,
  ChevronRight,
  CircleCheck,
  GraduationCap,
  Layers3,
  Menu,
  MessageCircle,
  Sparkles,
  Video,
  WandSparkles,
  X,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import logo from "@/assets/logo.svg";
import { CinematicHero } from "@/components/ui/cinematic-landing-hero";

const featureCards = [
  {
    icon: Brain,
    number: "01",
    title: "Make it make sense",
    copy: "Dense information becomes a clean, skimmable explanation with the jargon gently removed.",
    color: "bg-[#d8f36a]",
  },
  {
    icon: Video,
    number: "02",
    title: "See the lightbulb",
    copy: "Turn a wall of information into a tiny illustrated lesson your customers will remember.",
    color: "bg-[#ff967f]",
  },
  {
    icon: Layers3,
    number: "03",
    title: "Practice at your pace",
    copy: "Get flashcards and quick checks that help people build confidence as they go.",
    color: "bg-[#9eb8ff]",
  },
];

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export default function Landing() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const goToAuth = () => navigate("/auth?returnTo=/dashboard");

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f8f5] text-[#17201d] selection:bg-[#d8f36a] selection:text-[#17201d]">
      <nav className="relative z-30 mx-auto flex w-full max-w-[1240px] items-center justify-between px-5 py-5 sm:px-8 lg:px-10 lg:py-7" aria-label="Main navigation">
        <button type="button" onClick={() => scrollToSection("top")} className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17201d] focus-visible:ring-offset-4">
          <img src={logo} alt="Notefox mark" className="h-8 w-8 rounded-[9px] bg-[#17201d]" />
          <span className="text-[17px] font-extrabold tracking-[-0.03em]">notefox<span className="text-[#ef5f47]">.</span></span>
        </button>
        <div className="hidden items-center gap-8 text-sm font-semibold text-[#68736c] md:flex">
          <button type="button" onClick={() => navigate("/library")} className="transition-colors hover:text-[#17201d]">Explore library</button>
          <button type="button" onClick={() => scrollToSection("how-it-works")} className="transition-colors hover:text-[#17201d]">How it works</button>
          <button type="button" onClick={() => scrollToSection("stories")} className="transition-colors hover:text-[#17201d]">Customer stories</button>
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <button type="button" onClick={goToAuth} className="px-3 py-2 text-sm font-bold text-[#68736c] transition-colors hover:text-[#17201d]">Log in</button>
          <button type="button" onClick={goToAuth} className="inline-flex items-center gap-2 rounded-xl bg-[#17201d] px-4 py-2.5 text-sm font-bold text-white shadow-[0_3px_0_#0c100e] transition-transform hover:-translate-y-0.5 hover:bg-[#26362d]">Start free <ArrowUpRight className="h-4 w-4" /></button>
        </div>
        <button type="button" aria-label={mobileOpen ? "Close menu" : "Open menu"} onClick={() => setMobileOpen((value) => !value)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#17201d]/10 bg-white md:hidden">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="absolute left-5 right-5 top-[76px] rounded-2xl border border-[#17201d]/10 bg-white p-3 shadow-xl md:hidden">
            <button type="button" onClick={() => { navigate("/library"); setMobileOpen(false); }} className="block w-full rounded-lg px-3 py-3 text-left text-sm font-bold hover:bg-[#f7f8f5]">Explore library</button>
            <button type="button" onClick={() => { scrollToSection("how-it-works"); setMobileOpen(false); }} className="block w-full rounded-lg px-3 py-3 text-left text-sm font-bold hover:bg-[#f7f8f5]">How it works</button>
            <button type="button" onClick={goToAuth} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#17201d] px-4 py-3 text-sm font-bold text-white">Start free <ArrowRight className="h-4 w-4" /></button>
          </motion.div>
        )}
      </nav>

      <CinematicHero
        id="top"
        brandName="Notefox"
        tagline1="Make sense of it,"
        tagline2="faster."
        cardHeading="Learning, reimagined."
        metricValue={98}
        metricLabel="Clarity score"
        ctaHeading="Make learning click."
        ctaDescription="Turn dense information into clear, memorable learning your customers can use right away."
        primaryCtaLabel="Start for free"
        primaryCtaHref="#/auth?returnTo=%2Fdashboard"
        secondaryCtaLabel="Explore library"
        secondaryCtaHref="#/library"
      />

      <section className="border-y border-[#17201d]/10 bg-white" aria-label="Customer proof">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-x-8 gap-y-4 px-5 py-5 sm:px-8 lg:px-10">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#98a09b]">A better way to learn</p>
          <div className="flex flex-wrap items-center gap-x-7 gap-y-3 text-sm font-bold text-[#68736c]"><span className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-[#ef5f47]" /> 12,000+ learning sessions</span><span className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-[#4e7bff]" /> 4.9/5 from curious customers</span><span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-[#d1ad00]" /> 100% less learning fog</span></div>
        </div>
      </section>

      <section id="toolkit" className="mx-auto max-w-[1240px] scroll-mt-8 px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[#ef5f47]">A learning toolkit</p><h2 className="max-w-[620px] text-4xl font-extrabold leading-[0.98] tracking-[-0.055em] sm:text-5xl">From “what is this?”<br />to “oh, now I get it.”</h2></div><p className="max-w-[300px] text-sm leading-6 text-[#68736c]">One friendly library for clear explanations, visual lessons, and practice materials that make new ideas easier to remember.</p></div>
        <div className="grid gap-4 md:grid-cols-3">{featureCards.map(({ icon: Icon, number, title, copy, color }, index) => (<motion.article key={number} initial={reduceMotion ? false : { opacity: 0, y: 18 }} whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ delay: index * 0.08 }} className="group min-h-[285px] rounded-[24px] border border-[#17201d]/10 bg-white p-6 shadow-[0_12px_30px_rgba(23,32,29,0.04)] transition-transform duration-300 hover:-translate-y-1"><div className="mb-14 flex items-start justify-between"><div className={`flex h-11 w-11 items-center justify-center rounded-[14px] ${color} text-[#17201d]`}><Icon className="h-5 w-5" /></div><span className="text-xs font-bold text-[#a1aaa4]">{number}</span></div><h3 className="text-xl font-extrabold tracking-[-0.03em]">{title}</h3><p className="mt-3 max-w-[310px] text-sm leading-6 text-[#68736c]">{copy}</p><ChevronRight className="mt-5 h-5 w-5 text-[#ef5f47] transition-transform group-hover:translate-x-1" /></motion.article>))}</div>
      </section>

      <section id="how-it-works" className="scroll-mt-8 bg-[#17201d] px-5 py-20 text-white sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto grid max-w-[1240px] gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center"><div><p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[#d8f36a]">No productivity cosplay</p><h2 className="max-w-[450px] text-4xl font-extrabold leading-[0.98] tracking-[-0.055em] sm:text-5xl">Three steps between you and the “I got this.”</h2><p className="mt-6 max-w-[390px] text-sm leading-6 text-white/60">Bring the information. Notefox handles the organizing, simplifying, and friendly guidance that helps people move faster.</p><button type="button" onClick={goToAuth} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#d8f36a] px-5 py-3.5 text-sm font-bold text-[#17201d] transition-transform hover:-translate-y-0.5">Try Notefox <ArrowUpRight className="h-4 w-4" /></button></div><div className="grid gap-3">{[{ icon: BookOpen, title: "Drop in the chaos", copy: "Paste notes, upload a guide, or start with a topic." }, { icon: WandSparkles, title: "Pick your brain food", copy: "Choose a clear guide, an illustrated mini lesson, or flashcards." }, { icon: CircleCheck, title: "Actually remember it", copy: "Review at your pace with quick checks that show what stuck." }].map(({ icon: Icon, title, copy }, index) => (<div key={title} className="flex items-start gap-4 rounded-[20px] border border-white/10 bg-white/[0.04] p-5"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#17201d]"><Icon className="h-5 w-5" /></div><div><div className="flex items-center gap-2"><span className="text-xs font-bold text-[#d8f36a]">0{index + 1}</span><h3 className="font-bold">{title}</h3></div><p className="mt-1 text-sm leading-6 text-white/55">{copy}</p></div></div>))}</div></div>
      </section>

      <section id="stories" className="mx-auto max-w-[1240px] scroll-mt-8 px-5 py-20 sm:px-8 lg:px-10 lg:py-28"><div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]"><div className="rounded-[26px] bg-[#ff967f] p-7 sm:p-10"><div className="flex items-start justify-between gap-5"><p className="max-w-[500px] text-2xl font-extrabold leading-[1.02] tracking-[-0.04em] sm:text-4xl">“It turned a three-hour onboarding session into something our customers could understand and use right away.”</p><span className="text-3xl">“</span></div><div className="mt-12 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#17201d] text-sm font-bold text-white">JM</div><div><p className="text-sm font-bold">Jordan M.</p><p className="text-xs text-[#17201d]/60">Customer education lead · Brightside</p></div></div></div><div className="flex flex-col justify-between rounded-[26px] border border-[#17201d]/10 bg-white p-7 sm:p-10"><div><div className="mb-7 flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#9eb8ff]"><Sparkles className="h-5 w-5" /></div><h3 className="max-w-[280px] text-2xl font-extrabold leading-[1.05] tracking-[-0.04em]">Your next customer has a question.</h3><p className="mt-3 text-sm leading-6 text-[#68736c]">Give them a clearer way to find the answer and keep going.</p></div><button type="button" onClick={goToAuth} className="mt-8 flex items-center justify-between border-t border-[#17201d]/10 pt-5 text-sm font-bold">Make learning easier <ArrowRight className="h-4 w-4 text-[#ef5f47]" /></button></div></div></section>

      <section className="px-5 pb-10 sm:px-8 lg:px-10"><div className="relative mx-auto max-w-[1240px] overflow-hidden rounded-[28px] bg-[#d8f36a] px-6 py-12 sm:px-12 lg:py-16"><span className="absolute -right-14 -top-20 h-48 w-48 rounded-full border-[32px] border-[#17201d]/10" /><span className="absolute bottom-[-100px] left-[42%] h-44 w-44 rounded-full border-[24px] border-[#ef5f47]/20" /><div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-end"><div><p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[#17201d]/55">Your customers called</p><h2 className="max-w-[650px] text-4xl font-extrabold leading-[0.95] tracking-[-0.055em] sm:text-5xl">Let&apos;s make learning<br />a little less dramatic.</h2></div><button type="button" onClick={goToAuth} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#17201d] px-5 py-3.5 text-sm font-bold text-white shadow-[0_4px_0_#0c100e] transition-transform hover:-translate-y-0.5">Create your learning space <ArrowRight className="h-4 w-4" /></button></div></div></section>

      <footer className="mx-auto flex max-w-[1240px] flex-col gap-4 px-5 py-8 text-xs font-semibold text-[#87908a] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10"><div className="flex items-center gap-2"><img src={logo} alt="" className="h-5 w-5 rounded-[5px]" /><span>notefox<span className="text-[#ef5f47]">.</span></span></div><p>Made for curious people with too many tabs open.</p><p>© 2026 Notefox</p></footer>
    </main>
  );
}
