import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  FileText,
  Home,
  Layers3,
  Menu,
  Play,
  ShoppingCart,
  Sparkles,
  Star,
  Target,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

function BrandMark({ onClick }: { onClick?: () => void }) {
  const content = (
    <>
      <div className="flex items-center justify-center h-8 w-8 rounded-[10px] bg-navy-ink">
        <span className="flex h-3 w-3 rounded-full bg-mint-500" aria-hidden="true" />
      </div>
      <span className="text-xl font-semibold tracking-tight text-navy-ink">
        Gratter
      </span>
    </>
  );

  if (!onClick) {
    return <div className="flex items-center gap-2.5">{content}</div>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 pressable"
    >
      {content}
    </button>
  );
}

function NavLink({ children, href, onClick, active = false }: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-sm font-medium transition-colors pressable ${
        active
          ? "text-navy-ink"
          : "text-slate-500 hover:text-navy-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      }`}
    >
      {children}
    </button>
  );
}

function Header({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  return (
    <header className="relative z-30 border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0">
      <nav
        className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        <BrandMark onClick={() => window.location.href = "/"} />

        <div className="hidden items-center gap-8 md:flex">
          <NavLink active onClick={() => window.location.href = "/"} >Home</NavLink>
          <NavLink onClick={() => window.location.href = "/about"} >About</NavLink>
          <NavLink onClick={() => window.location.href = "/courses"} >Courses</NavLink>
          <NavLink onClick={() => window.location.href = "/blogs"} >Blogs</NavLink>
          <NavLink onClick={() => window.location.href = "/pricing"} >Pricing</NavLink>
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <button
            type="button"
            className="relative flex items-center gap-2 rounded-lg px-3 py-2 text-slate-500 transition-colors hover:text-navy-ink pressable focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Shopping cart"
          >
            <ShoppingCart className="h-5 w-5" strokeWidth={2} />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-white">
              3
            </span>
          </button>
          <button
            type="button"
            onClick={onLogin}
            className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary to-blue-600 transition-all pressable hover:shadow-lg hover:shadow-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Get Started
          </button>
        </div>

        <button
          type="button"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((value) => !value)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white md:hidden pressable"
        >
          {mobileOpen ? <X className="h-5 w-5 text-navy-ink" /> : <Menu className="h-5 w-5 text-navy-ink" />}
        </button>

        {mobileOpen && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="absolute left-4 right-4 top-full z-20 rounded-xl border border-slate-200 bg-white p-4 shadow-lg md:hidden"
            style={{ animationDuration: reduceMotion ? "0.01ms" : "200ms" }}
          >
            <div className="flex flex-col gap-2">
              <NavLink onClick={() => { window.location.href = "/"; setMobileOpen(false); }} >Home</NavLink>
              <NavLink onClick={() => { window.location.href = "/about"; setMobileOpen(false); }} >About</NavLink>
              <NavLink onClick={() => { window.location.href = "/courses"; setMobileOpen(false); }} >Courses</NavLink>
              <NavLink onClick={() => { window.location.href = "/blogs"; setMobileOpen(false); }} >Blogs</NavLink>
              <NavLink onClick={() => { window.location.href = "/pricing"; setMobileOpen(false); }} >Pricing</NavLink>
            </div>
            <div className="mt-4 flex flex-col gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => { onLogin(); setMobileOpen(false); }}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold text-white bg-gradient-to-r from-primary to-blue-600 pressable hover:shadow-lg hover:shadow-primary/25"
              >
                Get Started
              </button>
            </div>
          </motion.div>
        )}
      </nav>
    </header>
  );
}

function Hero({ onGetStarted, onBrowseCourses }: { onGetStarted: () => void; onBrowseCourses: () => void }) {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="hero"
      className="relative mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-8 lg:py-24"
      aria-labelledby="hero-heading"
    >
      <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          style={{ animationDuration: reduceMotion ? "0.01ms" : "600ms" }}
          className="stagger-children"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Learn Anytime, Anywhere
          </p>
          <h1
            id="hero-heading"
            className="mt-4 max-w-2xl text-4xl font-semibold leading-[1.1] tracking-tight text-navy-ink sm:text-5xl lg:text-6xl"
          >
            Unlock Your{" "}
            <span className="relative text-mint-600">
              <span className="relative z-10">Potential</span>
              <span
                className="absolute bottom-1 left-0 right-0 h-2 bg-mint-100"
                aria-hidden="true"
              />
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-7 text-slate-600">
            Access world-class courses from top educators. Learn at your own pace
            with flexible schedules and earn certificates that advance your career.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <motion.button
              type="button"
              onClick={onGetStarted}
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: [0.23, 1, 0.32, 1] }}
              style={{ animationDuration: reduceMotion ? "0.01ms" : "500ms" }}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-sm font-semibold text-white pressable hover:shadow-lg hover:shadow-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              Get Started
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </motion.button>
            <motion.button
              type="button"
              onClick={onBrowseCourses}
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
              style={{ animationDuration: reduceMotion ? "0.01ms" : "500ms" }}
              className="inline-flex items-center gap-2 rounded-lg border-2 border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-navy-ink pressable hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              Browse Courses
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
          style={{ animationDuration: reduceMotion ? "0.01ms" : "700ms" }}
          className="relative"
        >
          <HeroVisual reduceMotion={reduceMotion} />
        </motion.div>
      </div>
    </section>
  );
}

function HeroVisual({ reduceMotion }: { reduceMotion: boolean | null }) {
  return (
    <div className="relative aspect-[4/3] max-w-lg mx-auto">
      {/* Center video call panel */}
      <div className="relative z-10 rounded-2xl bg-slate-100 p-1 shadow-xl sm:p-2">
        <div className="rounded-xl bg-slate-900 overflow-hidden">
          <div className="aspect-video bg-slate-800 relative">
            {/* Video feed placeholder */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-slate-400">
                <Play className="mx-auto h-12 w-12 text-slate-500" strokeWidth={1.5} />
                <p className="mt-3 text-sm font-medium">Live Session</p>
                <p className="text-xs">Project Management Essentials</p>
              </div>
            </div>
            {/* Call controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
              <button className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-700 text-slate-200 hover:bg-slate-600 pressable" aria-label="Mute">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              </button>
              <button className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 pressable" aria-label="End call">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <button className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-700 text-slate-200 hover:bg-slate-600 pressable" aria-label="Camera">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating course card - bottom left */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 30, rotate: -3 }}
        animate={{ opacity: 1, y: 0, rotate: -3 }}
        transition={{ duration: 0.7, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
        style={{ animationDuration: reduceMotion ? "0.01ms" : "700ms" }}
        className="absolute -bottom-6 -left-4 z-20 w-72 rounded-xl bg-white p-4 shadow-2xl border border-slate-200"
      >
        <div className="aspect-video rounded-lg bg-gradient-to-br from-primary/10 to-blue-600/10 mb-3 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <Play className="h-10 w-10 text-primary/50" strokeWidth={1.5} />
          </div>
        </div>
        <h3 className="font-semibold text-navy-ink text-sm leading-snug mb-2">
          Project Management Essentials
        </h3>
        <p className="text-xs text-slate-500 mb-3">From Planning To Execution</p>
        <button className="w-full rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white pressable hover:shadow-md hover:shadow-primary/25">
          Enroll Now
        </button>
      </motion.div>

      {/* Stat cards - bottom right */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
        style={{ animationDuration: reduceMotion ? "0.01ms" : "700ms" }}
        className="absolute -bottom-6 -right-4 z-20 flex gap-3"
      >
        <div className="rounded-xl bg-white p-4 shadow-2xl border border-slate-200 min-w-[120px]">
          <p className="text-2xl font-bold text-primary">200+</p>
          <p className="text-xs text-slate-500">Total Courses</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-2xl border border-slate-200 min-w-[120px]">
          <p className="text-2xl font-bold text-primary">50+</p>
          <p className="text-xs text-slate-500">Expert Tutors</p>
        </div>
      </motion.div>

      {/* Tilted course cards - right side */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, x: 40, rotate: 8 }}
        animate={{ opacity: 1, x: 0, rotate: 8 }}
        transition={{ duration: 0.8, delay: 0.35, ease: [0.23, 1, 0.32, 1] }}
        style={{ animationDuration: reduceMotion ? "0.01ms" : "800ms" }}
        className="absolute top-20 right-20 z-10 w-56"
      >
        <div className="rounded-xl bg-white p-3 shadow-2xl border border-slate-200 mb-3 transform hover:-translate-y-1 transition-transform duration-300 hover-lift">
          <div className="aspect-video rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 mb-2" />
          <p className="text-xs font-medium text-navy-ink">Business Strategy</p>
          <p className="text-[10px] text-slate-500">12 lessons • 3h 45m</p>
        </div>
      </motion.div>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, x: 40, rotate: -5 }}
        animate={{ opacity: 1, x: 0, rotate: -5 }}
        transition={{ duration: 0.8, delay: 0.4, ease: [0.23, 1, 0.32, 1] }}
        style={{ animationDuration: reduceMotion ? "0.01ms" : "800ms" }}
        className="absolute top-44 right-32 z-10 w-56"
      >
        <div className="rounded-xl bg-white p-3 shadow-2xl border border-slate-200 mb-3 transform hover:-translate-y-1 transition-transform duration-300 hover-lift">
          <div className="aspect-video rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 mb-2" />
          <p className="text-xs font-medium text-navy-ink">Data Analytics</p>
          <p className="text-[10px] text-slate-500">8 lessons • 2h 30m</p>
        </div>
      </motion.div>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 30, rotate: 3 }}
        animate={{ opacity: 1, y: 0, rotate: 3 }}
        transition={{ duration: 0.8, delay: 0.45, ease: [0.23, 1, 0.32, 1] }}
        style={{ animationDuration: reduceMotion ? "0.01ms" : "800ms" }}
        className="absolute bottom-20 right-28 z-10 w-56"
      >
        <div className="rounded-xl bg-white p-3 shadow-2xl border border-slate-200 transform hover:-translate-y-1 transition-transform duration-300 hover-lift">
          <div className="aspect-video rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 mb-2" />
          <p className="text-xs font-medium text-navy-ink">UX Design Fundamentals</p>
          <p className="text-[10px] text-slate-500">15 lessons • 4h 20m</p>
        </div>
      </motion.div>
    </div>
  );
}

const benefits = [
  {
    icon: Target,
    title: "Expert-Led Courses",
    description: "Learn from industry professionals with real-world experience and proven teaching methods.",
  },
  {
    icon: BookOpen,
    title: "Flexible Learning",
    description: "Study at your own pace with 24/7 access to course materials from any device.",
  },
  {
    icon: Star,
    title: "Certificates That Matter",
    description: "Earn recognized certificates that demonstrate your skills to employers and clients.",
  },
  {
    icon: Users,
    title: "Community Support",
    description: "Connect with peers, ask questions, and collaborate with a global learning community.",
  },
];

function KeyBenefits() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="benefits"
      className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-8 lg:py-24"
      aria-labelledby="benefits-heading"
    >
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        style={{ animationDuration: reduceMotion ? "0.01ms" : "600ms" }}
        className="stagger-children max-w-2xl"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Key Benefits
        </p>
        <h2
          id="benefits-heading"
          className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-navy-ink sm:text-4xl"
        >
          Why choose{" "}
          <span className="text-mint-600">Gratter</span>
          for your learning journey?
        </h2>
        <p className="mt-6 text-lg leading-7 text-slate-600">
          We're committed to providing the best learning experience with quality content,
          flexible options, and a supportive community.
        </p>
      </motion.div>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
        style={{ animationDuration: reduceMotion ? "0.01ms" : "600ms" }}
        className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 stagger-children"
      >
        {benefits.map((benefit, index) => (
          <motion.div
            key={benefit.title}
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.08, ease: [0.23, 1, 0.32, 1] }}
            style={{ animationDuration: reduceMotion ? "0.01ms" : "500ms" }}
            className="group rounded-2xl bg-white p-6 shadow-sm border border-slate-200 hover:shadow-xl hover:border-primary/20 transition-all duration-300 hover-lift"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
              <benefit.icon className="h-6 w-6" strokeWidth={2} aria-hidden="true" />
            </div>
            <h3 className="font-semibold text-navy-ink mb-2">{benefit.title}</h3>
            <p className="text-sm leading-6 text-slate-600">{benefit.description}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <BrandMark />
            <p className="mt-4 max-w-xs text-sm text-slate-600">
              Empowering learners worldwide with accessible, high-quality education.
              Start your journey today.
            </p>
            <div className="mt-6 flex gap-4">
              <a href="#" className="text-slate-400 hover:text-primary transition-colors" aria-label="Twitter">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" /></svg>
              </a>
              <a href="#" className="text-slate-400 hover:text-primary transition-colors" aria-label="LinkedIn">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 6a2 2 0 100-4 2 2 0 000 4z" /></svg>
              </a>
              <a href="#" className="text-slate-400 hover:text-primary transition-colors" aria-label="GitHub">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" /></svg>
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-navy-ink">Product</h4>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li><a href="#" className="hover:text-primary transition-colors">Courses</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Certificates</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">For Teams</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-navy-ink">Company</h4>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li><a href="#" className="hover:text-primary transition-colors">About</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-navy-ink">Legal</h4>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>© 2026 Gratter. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
            <a href="#" className="hover:text-primary transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function Landing() {
  const navigate = useNavigate();

  const goToAuth = () => {
    navigate("/auth");
  };

  const scrollToSection = (id: string) => {
    const reduceMotion = useReducedMotion();
    document.getElementById(id)?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <main className="min-h-screen bg-white text-navy-ink selection:bg-primary selection:text-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-primary"
      >
        Skip to main content
      </a>

      <Header
        onLogin={goToAuth}
        onRegister={goToAuth}
      />

      <div id="main-content">
        <Hero
          onGetStarted={goToAuth}
          onBrowseCourses={() => scrollToSection("courses")}
        />
        <KeyBenefits />
      </div>

      <Footer />
    </main>
  );
}