import React, { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const INJECTED_STYLES = `
  .film-grain {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 50;
    opacity: 0.05;
    mix-blend-mode: overlay;
    background: url('data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23noiseFilter)"/></svg>');
  }

  .bg-grid-theme {
    background-size: 60px 60px;
    background-image:
      linear-gradient(to right, color-mix(in srgb, var(--color-foreground) 5%, transparent) 1px, transparent 1px),
      linear-gradient(to bottom, color-mix(in srgb, var(--color-foreground) 5%, transparent) 1px, transparent 1px);
    mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
    -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
  }

  .text-3d-matte {
    color: var(--color-foreground);
    text-shadow:
      0 10px 30px color-mix(in srgb, var(--color-foreground) 20%, transparent),
      0 2px 4px color-mix(in srgb, var(--color-foreground) 10%, transparent);
  }

  .text-silver-matte {
    background: linear-gradient(
      180deg,
      var(--color-foreground) 0%,
      color-mix(in srgb, var(--color-foreground) 40%, transparent) 100%
    );
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    transform: translateZ(0);
    filter:
      drop-shadow(0 10px 20px color-mix(in srgb, var(--color-foreground) 15%, transparent))
      drop-shadow(0 2px 4px color-mix(in srgb, var(--color-foreground) 10%, transparent));
  }

  .text-card-silver-matte {
    background: linear-gradient(180deg, #ffffff 0%, #a1a1aa 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    transform: translateZ(0);
    filter:
      drop-shadow(0 12px 24px rgba(0, 0, 0, 0.8))
      drop-shadow(0 4px 8px rgba(0, 0, 0, 0.6));
  }

  .premium-depth-card {
    background: linear-gradient(145deg, #162c6d 0%, #0a101d 100%);
    box-shadow:
      0 40px 100px -20px rgba(0, 0, 0, 0.9),
      0 20px 40px -20px rgba(0, 0, 0, 0.8),
      inset 0 1px 2px rgba(255, 255, 255, 0.2),
      inset 0 -2px 4px rgba(0, 0, 0, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.04);
    position: relative;
  }

  .card-sheen {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    z-index: 50;
    background: radial-gradient(
      800px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
      rgba(255, 255, 255, 0.08) 0%,
      transparent 40%
    );
    mix-blend-mode: screen;
    transition: opacity 0.3s ease;
  }

  .iphone-bezel {
    background-color: #111;
    box-shadow:
      inset 0 0 0 2px #52525b,
      inset 0 0 0 7px #000,
      0 40px 80px -15px rgba(0, 0, 0, 0.9),
      0 15px 25px -5px rgba(0, 0, 0, 0.7);
    transform-style: preserve-3d;
  }

  .hardware-btn {
    background: linear-gradient(90deg, #404040 0%, #171717 100%);
    box-shadow:
      -2px 0 5px rgba(0, 0, 0, 0.8),
      inset -1px 0 1px rgba(255, 255, 255, 0.15),
      inset 1px 0 2px rgba(0, 0, 0, 0.8);
    border-left: 1px solid rgba(255, 255, 255, 0.05);
  }

  .screen-glare {
    background: linear-gradient(
      110deg,
      rgba(255, 255, 255, 0.08) 0%,
      rgba(255, 255, 255, 0) 45%
    );
  }

  .widget-depth {
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.04) 0%,
      rgba(255, 255, 255, 0.01) 100%
    );
    box-shadow:
      0 10px 20px rgba(0, 0, 0, 0.3),
      inset 0 1px 1px rgba(255, 255, 255, 0.05),
      inset 0 -1px 1px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.03);
  }

  .floating-ui-badge {
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.08) 0%,
      rgba(255, 255, 255, 0.01) 100%
    );
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.1),
      0 25px 50px -12px rgba(0, 0, 0, 0.8),
      inset 0 1px 1px rgba(255, 255, 255, 0.2),
      inset 0 -1px 1px rgba(0, 0, 0, 0.5);
  }

  .btn-modern-light,
  .btn-modern-dark {
    transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
  }

  .btn-modern-light {
    background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%);
    color: #0f172a;
    box-shadow:
      0 0 0 1px rgba(0, 0, 0, 0.05),
      0 2px 4px rgba(0, 0, 0, 0.1),
      0 12px 24px -4px rgba(0, 0, 0, 0.3),
      inset 0 1px 1px #ffffff,
      inset 0 -3px 6px rgba(0, 0, 0, 0.06);
  }

  .btn-modern-light:hover,
  .btn-modern-dark:hover {
    transform: translateY(-3px);
  }

  .btn-modern-dark {
    background: linear-gradient(180deg, #27272a 0%, #18181b 100%);
    color: #ffffff;
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.1),
      0 2px 4px rgba(0, 0, 0, 0.6),
      0 12px 24px -4px rgba(0, 0, 0, 0.9),
      inset 0 1px 1px rgba(255, 255, 255, 0.15),
      inset 0 -3px 6px rgba(0, 0, 0, 0.8);
  }

  .btn-modern-dark:hover {
    background: linear-gradient(180deg, #3f3f46 0%, #27272a 100%);
  }

  .progress-ring {
    transform: rotate(-90deg);
    transform-origin: center;
    stroke-dasharray: 402;
    stroke-dashoffset: 402;
    stroke-linecap: round;
  }

  .scroll-hint {
    text-shadow: 0 2px 12px rgba(0, 0, 0, 0.45);
  }

  @keyframes hint-bob {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(5px);
    }
  }

  .hint-arrow {
    animation: hint-bob 1.6s ease-in-out infinite;
  }
`;

export interface CinematicHeroProps
  extends React.HTMLAttributes<HTMLDivElement> {
  brandName?: string;
  tagline1?: string;
  tagline2?: string;
  cardHeading?: string;
  cardDescription?: React.ReactNode;
  metricValue?: number;
  metricLabel?: string;
  ctaHeading?: string;
  ctaDescription?: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
}

export function CinematicHero({
  brandName = "Notefox",
  tagline1 = "Make sense of it,",
  tagline2 = "faster.",
  cardHeading = "Learning, reimagined.",
  cardDescription = (
    <>
      <span className="font-semibold text-white">Notefox</span> turns
      complicated information into clear notes, visual lessons, and practice
      materials people can actually use.
    </>
  ),
  metricValue = 98,
  metricLabel = "Clarity score",
  ctaHeading = "Make learning click.",
  ctaDescription = "Give every idea a clearer starting point with a learning space built for modern customers.",
  primaryCtaLabel = "Start for free",
  primaryCtaHref = "#/auth?returnTo=%2Fdashboard",
  secondaryCtaLabel = "Explore library",
  secondaryCtaHref = "#/library",
  className,
  ...props
}: CinematicHeroProps) {
  const mainCardRef = useRef<HTMLDivElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  // Simple mouse parallax for the card sheen (no GSAP)
  useEffect(() => {
    const card = mainCardRef.current;
    const mockup = mockupRef.current;
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;

    if (!card || !mockup || isTouchDevice || reduceMotion) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mouse-x", `${event.clientX - rect.left}px`);
      card.style.setProperty("--mouse-y", `${event.clientY - rect.top}px`);

      const xValue = (event.clientX / window.innerWidth - 0.5) * 2;
      const yValue = (event.clientY / window.innerHeight - 0.5) * 2;

      mockup.style.transform = `perspective(1000px) rotateY(${xValue * 8}deg) rotateX(${-yValue * 8}deg)`;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (mockup) {
        mockup.style.transform = "";
      }
    };
  }, [reduceMotion]);

  // Simplified entrance animations using Framer Motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.23, 1, 0.32, 1] as const, // --ease-out
      },
    },
  } as const;

  const headlineVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.7,
        ease: [0.23, 1, 0.32, 1] as const,
      },
    },
  } as const;

  return (
    <div
      className={cn(
        "relative flex min-h-screen w-screen items-center justify-center overflow-hidden bg-background font-sans antialiased text-foreground",
        className,
      )}
      style={{ perspective: "1500px" }}
      {...props}
    >
      <style dangerouslySetInnerHTML={{ __html: INJECTED_STYLES }} />

      <div className="film-grain" aria-hidden="true" />
      <div
        className="bg-grid-theme pointer-events-none absolute inset-0 z-0 opacity-50"
        aria-hidden="true"
      />

      {/* Headline section - simple entrance */}
      <motion.div
        className="hero-text-wrapper absolute z-10 flex w-screen flex-col items-center justify-center px-4 text-center"
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
        variants={containerVariants}
        style={{ transformStyle: "preserve-3d" }}
      >
        <motion.h1
          className="text-3d-matte mb-2 text-5xl font-bold tracking-tight md:text-7xl lg:text-[6rem]"
          variants={headlineVariants}
        >
          {tagline1}
        </motion.h1>

        <motion.h1
          className="text-silver-matte text-5xl font-extrabold tracking-tighter md:text-7xl lg:text-[6rem]"
          variants={headlineVariants}
        >
          {tagline2}
        </motion.h1>
      </motion.div>

      {/* Scroll hint - appears after content */}
      <motion.div
        className="scroll-hint pointer-events-none fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-1 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-white/70"
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      >
        <span>Scroll down to keep exploring</span>
        <span className="hint-arrow text-lg leading-none text-[#d8f36a]">↓</span>
      </motion.div>

      {/* Main card with mockup */}
      <motion.div
        ref={mainCardRef}
        className="pointer-events-auto relative flex h-[92vh] w-[92vw] max-h-[85vh] max-w-[85vw] items-center justify-center overflow-hidden rounded-[32px] md:h-[85vh] md:w-[85vw] md:rounded-[40px] premium-depth-card"
        initial={reduceMotion ? false : { opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1], delay: 0.2 }}
      >
        <div className="card-sheen" aria-hidden="true" />

        <motion.div
          className="relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col items-center justify-evenly px-4 py-6 lg:grid lg:grid-cols-3 lg:gap-8 lg:px-12 lg:py-0"
          initial={reduceMotion ? false : "hidden"}
          animate="visible"
          variants={containerVariants}
        >
          {/* Brand name on right */}
          <motion.div
            className="card-right-text order-1 z-20 flex w-full justify-center lg:order-3 lg:justify-end"
            variants={itemVariants}
          >
            <h2 className="text-card-silver-matte text-6xl font-black uppercase tracking-tighter md:text-[6rem] lg:mt-0 lg:text-[7rem]">
              {brandName}
            </h2>
          </motion.div>

          {/* Phone mockup in center */}
          <motion.div
            className="mockup-scroll-wrapper relative z-10 order-2 flex h-[380px] w-full items-center justify-center lg:order-2 lg:h-[600px]"
            style={{ perspective: "1000px" }}
            variants={itemVariants}
          >
            <div className="relative flex h-full w-full scale-[0.65] items-center justify-center md:scale-[0.85] lg:scale-100">
              <div
                ref={mockupRef}
                className="iphone-bezel transform-style-3d relative flex h-[580px] w-[280px] flex-col rounded-[3rem] will-change-transform gpu-accelerated"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="hardware-btn absolute left-[-3px] top-[120px] z-0 h-[25px] w-[3px] rounded-l-md" aria-hidden="true" />
                <div className="hardware-btn absolute left-[-3px] top-[160px] z-0 h-[45px] w-[3px] rounded-l-md" aria-hidden="true" />
                <div className="hardware-btn absolute left-[-3px] top-[220px] z-0 h-[45px] w-[3px] rounded-l-md" aria-hidden="true" />
                <div className="hardware-btn absolute right-[-3px] top-[170px] z-0 h-[70px] w-[3px] scale-x-[-1] rounded-r-md" aria-hidden="true" />

                <div className="absolute inset-[7px] z-10 overflow-hidden rounded-[2.5rem] bg-[#050914] text-white shadow-[inset_0_0_15px_rgba(0,0,0,1)]">
                  <div className="screen-glare pointer-events-none absolute inset-0 z-40" aria-hidden="true" />

                  <div className="absolute left-1/2 top-[5px] z-50 flex h-[28px] w-[100px] -translate-x-1/2 items-center justify-end rounded-full bg-black px-3 shadow-[inset_0_-1px_2px_rgba(255,255,255,0.1)]">
                    <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#d8f36a] shadow-[0_0_8px_rgba(216,243,106,.8)]" />
                  </div>

                  <div className="relative flex h-full w-full flex-col px-5 pb-8 pt-12">
                    <motion.div
                      className="phone-widget mb-8 flex items-center justify-between"
                      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.4, ease: [0.23, 1, 0.32, 1] }}
                    >
                      <div className="flex flex-col">
                        <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-neutral-400">Today</span>
                        <span className="text-xl font-bold tracking-tight text-white">Your learning space</span>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-bold text-[#d8f36a]">N</div>
                    </motion.div>

                    <motion.div
                      className="phone-widget relative mx-auto mb-8 flex h-44 w-44 items-center justify-center drop-shadow-[0_15px_25px_rgba(0,0,0,.8)]"
                      initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6, delay: 0.5, ease: [0.23, 1, 0.32, 1] }}
                    >
                      <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
                        <circle cx="88" cy="88" r="64" fill="none" stroke="rgba(255,255,255,.03)" strokeWidth="12" />
                        <motion.circle
                          className="progress-ring"
                          cx="88"
                          cy="88"
                          r="64"
                          fill="none"
                          stroke="#d8f36a"
                          strokeWidth="12"
                          initial={reduceMotion ? false : { pathLength: 0 }}
                          animate={{ pathLength: metricValue / 100 }}
                          transition={{ duration: 1.2, delay: 0.7, ease: [0.77, 0, 0.175, 1] }}
                        />
                      </svg>
                      <div className="z-10 flex flex-col items-center text-center">
                        <motion.span
                          className="counter-val text-4xl font-extrabold tracking-tighter text-white"
                          initial={reduceMotion ? false : { opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 1.2, delay: 0.7 }}
                        >
                          {reduceMotion ? metricValue : 0}
                        </motion.span>
                        <span className="mt-0.5 text-[8px] font-bold uppercase tracking-[.1em] text-[#d8f36a]/60">
                          {metricLabel}
                        </span>
                      </div>
                    </motion.div>

                    <motion.div
                      className="space-y-3"
                      initial={reduceMotion ? false : "hidden"}
                      animate="visible"
                      variants={containerVariants}
                    >
                      <motion.div
                        className="phone-widget widget-depth flex items-center rounded-2xl p-3"
                        variants={itemVariants}
                      >
                        <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-500/20 text-blue-400">✦</div>
                        <div className="flex-1">
                          <div className="mb-2 h-2 w-24 rounded-full bg-neutral-300" />
                          <div className="h-1.5 w-16 rounded-full bg-neutral-600" />
                        </div>
                      </motion.div>

                      <motion.div
                        className="phone-widget widget-depth flex items-center rounded-2xl p-3"
                        variants={itemVariants}
                      >
                        <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-500/20 text-emerald-400">✓</div>
                        <div className="flex-1">
                          <div className="mb-2 h-2 w-20 rounded-full bg-neutral-300" />
                          <div className="h-1.5 w-28 rounded-full bg-neutral-600" />
                        </div>
                      </motion.div>
                    </motion.div>

                    <div className="absolute bottom-2 left-1/2 h-[4px] w-[120px] -translate-x-1/2 rounded-full bg-white/20" />
                  </div>
                </div>

                <motion.div
                  className="floating-badge floating-ui-badge absolute left-[-15px] top-6 z-30 flex items-center gap-3 rounded-xl p-3 lg:left-[-80px] lg:top-12 lg:gap-4 lg:rounded-2xl lg:p-4"
                  initial={reduceMotion ? false : { opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.8, ease: [0.23, 1, 0.32, 1] }}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-400/30 bg-blue-500/20 lg:h-10 lg:w-10">
                    <span className="text-base lg:text-xl" aria-hidden="true">✦</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold tracking-tight text-white lg:text-sm">Clearer ideas</p>
                    <p className="text-[10px] font-medium text-blue-200/50 lg:text-xs">Just unlocked</p>
                  </div>
                </motion.div>

                <motion.div
                  className="floating-badge floating-ui-badge absolute bottom-12 right-[-15px] z-30 flex items-center gap-3 rounded-xl p-3 lg:bottom-20 lg:right-[-80px] lg:gap-4 lg:rounded-2xl lg:p-4"
                  initial={reduceMotion ? false : { opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.9, ease: [0.23, 1, 0.32, 1] }}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-indigo-400/30 bg-indigo-500/20 lg:h-10 lg:w-10">
                    <span className="text-base lg:text-lg" aria-hidden="true">✓</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold tracking-tight text-white lg:text-sm">Practice ready</p>
                    <p className="text-[10px] font-medium text-blue-200/50 lg:text-xs">Made for you</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Card description on left */}
          <motion.div
            className="card-left-text order-3 z-20 flex w-full max-w-none flex-col justify-center px-4 text-center lg:order-1 lg:px-0 lg:text-left"
            variants={itemVariants}
          >
            <h3 className="mb-0 text-2xl font-bold tracking-tight text-white md:text-3xl lg:mb-5 lg:text-4xl">
              {cardHeading}
            </h3>
            <p className="hidden max-w-sm text-sm font-normal leading-relaxed text-blue-100/70 md:block lg:max-w-none lg:text-lg">
              {cardDescription}
            </p>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* CTA section at bottom */}
      <motion.div
        className="cta-wrapper pointer-events-auto absolute bottom-0 z-30 flex w-screen flex-col items-center justify-center px-4 pb-8 text-center"
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.1, ease: [0.23, 1, 0.32, 1] }}
      >
        <h2 className="text-card-silver-matte mb-6 text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
          {ctaHeading}
        </h2>
        <p className="mb-12 max-w-xl text-lg font-light leading-relaxed text-blue-100/70 md:text-xl">
          {ctaDescription}
        </p>
        <div className="flex flex-col gap-6 sm:flex-row">
          <a
            href={primaryCtaHref}
            className="btn-modern-light flex items-center justify-center gap-3 rounded-[1.25rem] px-8 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 pressable"
            style={{ transition: "transform 150ms cubic-bezier(0.23, 1, 0.32, 1)" }}
          >
            <span className="text-left">
              <span className="mb-[-2px] block text-[10px] font-bold uppercase tracking-wider text-neutral-500">Your next step</span>
              <span className="block text-xl font-bold leading-none tracking-tight">{primaryCtaLabel}</span>
            </span>
          </a>
          <a
            href={secondaryCtaHref}
            className="btn-modern-dark flex items-center justify-center gap-3 rounded-[1.25rem] px-8 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 pressable"
            style={{ transition: "transform 150ms cubic-bezier(0.23, 1, 0.32, 1)" }}
          >
            <span className="text-left">
              <span className="mb-[-2px] block text-[10px] font-bold uppercase tracking-wider text-neutral-400">Browse the</span>
              <span className="block text-xl font-bold leading-none tracking-tight">{secondaryCtaLabel}</span>
            </span>
          </a>
        </div>
      </motion.div>
    </div>
  );
}