import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Brain,
  Check,
  ChevronRight,
  CircleCheck,
  FileText,
  GraduationCap,
  Layers3,
  Menu,
  MessageCircle,
  Play,
  Sparkles,
  Video,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import logo from "@/assets/logo.svg";

type DemoMode = "notes" | "video" | "cards";

const demoModes: Array<{
  id: DemoMode;
  label: string;
  icon: typeof FileText;
  description: string;
}> = [
  {
    id: "notes",
    label: "Clear notes",
    icon: FileText,
    description: "The 30-second version",
  },
  {
    id: "video",
    label: "Mini lesson",
    icon: Video,
    description: "Watch the idea click",
  },
  {
    id: "cards",
    label: "Flashcards",
    icon: Layers3,
    description: "Quiz yourself later",
  },
];

const sampleNotes =
  "Photosynthesis is the process plants use to convert light energy into chemical energy. Chlorophyll absorbs light, mostly in the blue and red parts of the spectrum. The light-dependent reactions happen in the thylakoid membranes and produce ATP and NADPH. The Calvin cycle uses those molecules to make glucose.";

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

function GuideCharacter({
  mode,
  onClick,
}: {
  mode: DemoMode;
  onClick: () => void;
}) {
  const messages: Record<DemoMode, string> = {
    notes: "I speak fluent jargon.",
    video: "Tiny lesson. Big aha.",
    cards: "No peeking. Probably.",
  };

  return (
    <motion.button
      type="button"
      aria-label="Get a learning pep talk"
      onClick={onClick}
      className="group absolute -bottom-7 -left-7 z-20 flex items-end gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17201d] focus-visible:ring-offset-4"
      animate={{ y: [0, -5, 0], rotate: [-1, 1, -1] }}
      transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
    >
      <span className="relative flex h-[92px] w-[92px] items-center justify-center rounded-[34px] rounded-bl-[18px] border-[3px] border-[#17201d] bg-[#d8f36a] shadow-[5px_6px_0_#17201d] transition-transform duration-200 group-hover:rotate-[-5deg]">
        <span className="absolute left-[23px] top-[31px] h-2.5 w-2.5 rounded-full bg-[#17201d]" />
        <span className="absolute right-[23px] top-[31px] h-2.5 w-2.5 rounded-full bg-[#17201d]" />
        <span className="absolute bottom-[22px] left-1/2 h-3 w-7 -translate-x-1/2 rounded-b-full border-b-[3px] border-[#17201d]" />
        <span className="absolute -top-4 left-[27px] h-5 w-3 rotate-[-16deg] rounded-full bg-[#d8f36a]" />
        <span className="absolute -top-5 right-[25px] h-6 w-3 rotate-[22deg] rounded-full bg-[#d8f36a]" />
        <Sparkles className="absolute -right-2 -top-3 h-5 w-5 text-[#ff7357]" strokeWidth={3} />
      </span>
      <span className="mb-8 hidden max-w-[150px] rounded-2xl rounded-bl-sm border border-[#17201d]/10 bg-white px-3 py-2 text-xs font-semibold leading-4 text-[#17201d] shadow-[0_10px_24px_rgba(23,32,29,0.08)] sm:block">
        {messages[mode]}
      </span>
    </motion.button>
  );
}

function DemoOutput({ mode }: { mode: DemoMode }) {
  if (mode === "video") {
    return (
      <motion.div
        key="video"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative flex min-h-[260px] flex-col justify-between overflow-hidden rounded-[22px] bg-[#17201d] p-5 text-white"
      >
        <div className="relative z-10 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.12em] text-white/55">
          <span>01 / 04</span>
          <span className="flex items-center gap-1.5 text-[#d8f36a]"><span className="h-1.5 w-1.5 rounded-full bg-[#d8f36a]" /> Playing</span>
        </div>
        <div className="relative z-10 my-3">
          <div className="mb-3 flex h-24 items-center justify-center">
            <div className="relative h-20 w-28 rounded-[18px] border-2 border-[#d8f36a] bg-[#31423a]">
              <div className="absolute left-6 top-6 h-8 w-8 rounded-full bg-[#d8f36a]" />
              <div className="absolute bottom-3 right-5 h-10 w-10 rounded-t-full border-2 border-[#ff967f] bg-[#ff7357]" />
              <div className="absolute -right-6 top-4 h-10 w-10 rounded-full border-2 border-[#f5efe4] bg-[#f5efe4]" />
              <div className="absolute -right-3 top-7 h-1.5 w-1.5 rounded-full bg-[#17201d]" />
              <div className="absolute -right-1 top-7 h-1.5 w-1.5 rounded-full bg-[#17201d]" />
            </div>
            <div className="absolute h-px w-40 rotate-[-16deg] bg-white/10" />
          </div>
          <p className="max-w-[240px] text-xl font-semibold leading-6">Plants are basically tiny solar panels.</p>
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-1.5 flex-1 rounded-full bg-white/15"><div className="h-full w-[42%] rounded-full bg-[#d8f36a]" /></div>
          <span className="text-[11px] text-white/50">0:42</span>
        </div>
        <span className="absolute -right-8 -top-8 h-28 w-28 rounded-full border-[18px] border-[#ff7357]/80" />
        <span className="absolute -bottom-12 -left-8 h-28 w-28 rounded-full bg-[#4e7bff]/30" />
      </motion.div>
    );
  }

  if (mode === "cards") {
    return (
      <motion.div
        key="cards"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-[260px] rounded-[22px] bg-[#eef0ec] p-5"
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b756f]">Quick check</p>
            <p className="mt-1 text-sm font-semibold text-[#17201d]">Photosynthesis · 1 of 8</p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#17201d]"><Zap className="h-4 w-4" /></div>
        </div>
        <div className="flex min-h-[156px] flex-col items-center justify-center rounded-[17px] border border-[#17201d]/10 bg-white px-7 text-center shadow-[0_8px_0_#dfe4dc]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b756f]">What does chlorophyll do?</p>
          <p className="mt-3 text-lg font-semibold leading-6 text-[#17201d]">Tap to reveal your answer</p>
          <button type="button" className="mt-5 text-xs font-semibold text-[#ef5f47] underline underline-offset-4">Reveal answer</button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="notes"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-[260px] rounded-[22px] bg-[#fffaf2] p-5"
    >
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b756f]">In human-speak</p>
          <p className="mt-1 text-sm font-semibold text-[#17201d]">Photosynthesis, but chill</p>
        </div>
        <span className="rounded-full bg-[#d8f36a] px-2.5 py-1 text-[10px] font-bold text-[#17201d]">98% clear</span>
      </div>
      <div className="space-y-3 text-sm leading-5 text-[#34423b]">
        <p><span className="rounded bg-[#d8f36a] px-1 font-semibold text-[#17201d]">Photosynthesis</span> is how plants turn sunlight into food. Think of it as plant-powered meal prep.</p>
        <div className="flex gap-2.5 rounded-xl border border-[#17201d]/10 bg-white/80 p-3"><CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#ef5f47]" /><span>Chlorophyll catches the light, especially blue and red light.</span></div>
        <div className="flex gap-2.5 rounded-xl border border-[#17201d]/10 bg-white/80 p-3"><CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#ef5f47]" /><span>The light reactions make energy the plant can spend later.</span></div>
      </div>
    </motion.div>
  );
}

function StudyDemo() {
  const [mode, setMode] = useState<DemoMode>("notes");
  const [notes, setNotes] = useState("");
  const [pepTalk, setPepTalk] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.7 }}
      className="relative rounded-[30px] border border-[#17201d]/10 bg-white p-3 shadow-[0_30px_70px_rgba(23,32,29,0.12)] sm:p-4"
    >
      <div className="rounded-[23px] border border-[#17201d]/10 bg-[#f7f8f5] p-4 sm:p-5">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#17201d] text-[#d8f36a]"><WandSparkles className="h-4 w-4" /></div>
            <div><p className="text-sm font-bold text-[#17201d]">The learning remix</p><p className="text-[11px] text-[#7a837e]">A very small miracle</p></div>
          </div>
          <span className="hidden rounded-full border border-[#17201d]/10 bg-white px-2.5 py-1 text-[10px] font-bold text-[#7a837e] sm:inline-flex">LIVE PREVIEW</span>
        </div>
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex min-h-[260px] flex-col rounded-[22px] border border-[#17201d]/10 bg-white p-4">
            <div className="mb-3 flex items-center justify-between"><p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#7a837e]">Your starting point</p><FileText className="h-4 w-4 text-[#ef5f47]" /></div>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Paste notes, a guide, or the thing you promised you would read tonight..."
              className="min-h-[145px] flex-1 resize-none border-0 bg-transparent text-sm leading-5 text-[#34423b] outline-none placeholder:text-[#a2aaa5]"
              aria-label="Paste your notes"
            />
            <button
              type="button"
              onClick={() => setNotes(sampleNotes)}
              className="mt-3 self-start text-xs font-bold text-[#ef5f47] underline decoration-[#ef5f47]/30 underline-offset-4 transition-colors hover:text-[#d44d38]"
            >
              Use a sample dump
            </button>
          </div>
          <div className="relative min-w-0">
            <div className="mb-3 flex gap-1 rounded-xl border border-[#17201d]/10 bg-white p-1">
              {demoModes.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMode(id)}
                  className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-bold transition-all sm:text-xs ${mode === id ? "bg-[#17201d] text-white shadow-sm" : "text-[#7a837e] hover:bg-[#f0f2ee] hover:text-[#17201d]"}`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{label}</span>
                </button>
              ))}
            </div>
            <DemoOutput mode={mode} />
            <GuideCharacter mode={mode} onClick={() => setPepTalk((value) => !value)} />
            {pepTalk && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="absolute -bottom-4 left-20 z-30 max-w-[190px] rounded-xl border border-[#17201d]/10 bg-[#d8f36a] px-3 py-2 text-xs font-bold leading-4 text-[#17201d] shadow-lg"
              >
                You do not need motivation. You need a less cursed study guide.
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

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

      <section id="top" className="relative mx-auto max-w-[1240px] px-5 pb-20 pt-10 sm:px-8 sm:pt-16 lg:px-10 lg:pb-28 lg:pt-20">
        <div className="pointer-events-none absolute -right-40 top-0 h-[460px] w-[460px] rounded-full border-[70px] border-[#d8f36a]/50" />
        <div className="pointer-events-none absolute -left-24 bottom-14 h-44 w-44 rounded-full bg-[#ff967f]/40" />
        <div className="relative grid items-center gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-14">
          <motion.div initial={{ opacity: 0, x: -22 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.65 }} className="relative z-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#17201d]/10 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#68736c] shadow-sm"><span className="h-2 w-2 rounded-full bg-[#ef5f47]" />For people who learn differently</div>
            <h1 className="max-w-[650px] text-[clamp(3.25rem,6.2vw,5.8rem)] font-extrabold leading-[0.93] tracking-[-0.07em] text-[#17201d]">Learning should fit<br /><span className="relative inline-block">the way you <span className="relative z-10">work.</span><span className="absolute bottom-1 left-0 right-0 -z-0 h-3 -rotate-2 rounded-full bg-[#d8f36a] sm:h-4" /></span></h1>
            <p className="mt-7 max-w-[520px] text-base leading-7 text-[#68736c] sm:text-lg">Notefox turns dense information into clear notes, tiny illustrated lessons, and flashcards that help people learn faster without making learning feel like a chore.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={goToAuth} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#17201d] px-5 py-3.5 text-sm font-bold text-white shadow-[0_4px_0_#0c100e] transition-all hover:-translate-y-0.5 hover:bg-[#26362d]">Start learning for free <ArrowRight className="h-4 w-4" /></button>
              <button type="button" onClick={() => scrollToSection("demo")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#17201d]/15 bg-white px-5 py-3.5 text-sm font-bold text-[#17201d] transition-all hover:-translate-y-0.5 hover:border-[#17201d]/30 hover:shadow-sm"><Play className="h-4 w-4 fill-[#ef5f47] text-[#ef5f47]" /> See the magic</button>
            </div>
            <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs font-semibold text-[#87908a]"><span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#ef5f47]" /> No credit card</span><span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#ef5f47]" /> Made for modern learners</span><span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#ef5f47]" /> Actually understandable</span></div>
          </motion.div>
          <div id="demo" className="relative z-10 scroll-mt-8"><StudyDemo /></div>
        </div>
      </section>

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
