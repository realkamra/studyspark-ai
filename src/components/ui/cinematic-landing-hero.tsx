import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { cn } from "@/lib/utils";

const INJECTED_STYLES = `
  .gsap-reveal {
    visibility: hidden;
  }

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
    transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
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
  const containerRef = useRef<HTMLDivElement>(null);
  const mainCardRef = useRef<HTMLDivElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = mainCardRef.current;
    const mockup = mockupRef.current;
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (!card || !mockup || isTouchDevice || prefersReducedMotion) {
      return;
    }

    const rotateYTo = gsap.quickTo(mockup, "rotationY", {
      duration: 0.8,
      ease: "power3.out",
    });

    const rotateXTo = gsap.quickTo(mockup, "rotationX", {
      duration: 0.8,
      ease: "power3.out",
    });

    let frameId = 0;
    let latestEvent: MouseEvent | null = null;

    const updateInteraction = () => {
      frameId = 0;

      if (!latestEvent || window.scrollY > window.innerHeight * 1.5) {
        return;
      }

      const event = latestEvent;
      const rect = card.getBoundingClientRect();

      card.style.setProperty(
        "--mouse-x",
        `${event.clientX - rect.left}px`,
      );
      card.style.setProperty(
        "--mouse-y",
        `${event.clientY - rect.top}px`,
      );

      const xValue = (event.clientX / window.innerWidth - 0.5) * 2;
      const yValue = (event.clientY / window.innerHeight - 0.5) * 2;

      rotateYTo(xValue * 12);
      rotateXTo(-yValue * 12);
    };

    const handleMouseMove = (event: MouseEvent) => {
      latestEvent = event;

      if (!frameId) {
        frameId = requestAnimationFrame(updateInteraction);
      }
    };

    window.addEventListener("mousemove", handleMouseMove, {
      passive: true,
    });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);

      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const isMobile = window.innerWidth < 768;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let hasStarted = false;
    let hasCompleted = false;

    const lockScroll = () => {
      window.scrollTo(0, 0);
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    };

    const unlockScroll = () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };

    const context = gsap.context(() => {
      gsap.set(".text-track", {
        autoAlpha: 0,
        y: 60,
        scale: 0.85,
        rotationX: -20,
      });

      gsap.set(".text-days", {
        autoAlpha: 1,
        clipPath: "inset(0 100% 0 0)",
      });

      gsap.set(".main-card", {
        y: window.innerHeight + 200,
        autoAlpha: 1,
      });

      gsap.set(
        [
          ".card-left-text",
          ".card-right-text",
          ".mockup-scroll-wrapper",
          ".floating-badge",
          ".phone-widget",
        ],
        {
          autoAlpha: 0,
        },
      );

      gsap.set(".cta-wrapper", {
        autoAlpha: 0,
        scale: 0.9,
      });

      gsap.set(".scroll-hint", {
        autoAlpha: 0,
        y: 8,
      });

      // Headline entrance on page load (independent of the cinematic).
      const introTimeline = gsap.timeline({ delay: 0.3 });

      introTimeline
        .to(".text-track", {
          duration: 1.6,
          autoAlpha: 1,
          y: 0,
          scale: 1,
          rotationX: 0,
          ease: "expo.out",
        })
        .to(
          ".text-days",
          {
            duration: 1.3,
            clipPath: "inset(0 0% 0 0)",
            ease: "power4.inOut",
          },
          "-=0.9",
        );

      // The cinematic sequence. Time-based: it plays itself once, at a
      // readable pace, and simply stops on its final frame.
      const cinematic = gsap.timeline({
        paused: true,
        onComplete: () => {
          hasCompleted = true;
          unlockScroll();
        },
      });

      cinematic
        // 1. Headline steps back while the card rises.
        .to(
          [".hero-text-wrapper", ".bg-grid-theme"],
          {
            scale: 1.1,
            opacity: 0.15,
            duration: 1.1,
            ease: "power2.inOut",
          },
          0,
        )
        .set(".start-hint", { autoAlpha: 0 }, 0)
        .to(
          ".main-card",
          {
            y: 0,
            duration: 1.7,
            ease: "power3.out",
          },
          0.1,
        )

        // 2. The card expands to fill the view.
        .to(".main-card", {
          width: "100%",
          height: "100%",
          borderRadius: "0px",
          duration: 1.2,
          ease: "power2.inOut",
        })

        // 3. The phone arrives.
        .fromTo(
          ".mockup-scroll-wrapper",
          {
            y: 260,
            z: -400,
            rotationX: 40,
            rotationY: -24,
            autoAlpha: 0,
            scale: 0.7,
          },
          {
            y: 0,
            z: 0,
            rotationX: 0,
            rotationY: 0,
            autoAlpha: 1,
            scale: 1,
            duration: 1.8,
            ease: "expo.out",
          },
        )

        // 4. The app interface builds itself.
        .fromTo(
          ".phone-widget",
          {
            y: 36,
            autoAlpha: 0,
            scale: 0.96,
          },
          {
            y: 0,
            autoAlpha: 1,
            scale: 1,
            stagger: 0.28,
            duration: 1.1,
            ease: "back.out(1.4)",
          },
          "-=1.2",
        )

        // 5. The progress ring draws and the counter counts up.
        .to(
          ".progress-ring",
          {
            strokeDashoffset: 60,
            duration: 1.7,
            ease: "power2.inOut",
          },
          "-=0.9",
        )
        .to(
          ".counter-val",
          {
            innerHTML: metricValue,
            snap: {
              innerHTML: 1,
            },
            duration: 1.7,
            ease: "power2.out",
          },
          "<",
        )

        // 6. The floating proof badges pop in.
        .fromTo(
          ".floating-badge",
          {
            y: 90,
            autoAlpha: 0,
            scale: 0.75,
            rotationZ: -8,
          },
          {
            y: 0,
            autoAlpha: 1,
            scale: 1,
            rotationZ: 0,
            stagger: 0.35,
            duration: 1.2,
            ease: "back.out(1.6)",
          },
          "-=1.1",
        )

        // 7. The card copy slides in.
        .fromTo(
          ".card-left-text",
          {
            x: -40,
            autoAlpha: 0,
          },
          {
            x: 0,
            autoAlpha: 1,
            duration: 1.2,
            ease: "power3.out",
          },
          "-=1",
        )
        .fromTo(
          ".card-right-text",
          {
            x: 40,
            autoAlpha: 0,
            scale: 0.9,
          },
          {
            x: 0,
            autoAlpha: 1,
            scale: 1,
            duration: 1.2,
            ease: "power3.out",
          },
          "<+0.15",
        )

        // 8. A quiet beat so the finished card can actually be read.
        .to({}, { duration: 1.1 })

        // 9. The card tidies itself into its resting frame.
        .to(
          [
            ".mockup-scroll-wrapper",
            ".floating-badge",
            ".card-left-text",
            ".card-right-text",
          ],
          {
            y: -30,
            autoAlpha: 0,
            scale: 0.95,
            stagger: 0.05,
            duration: 1,
            ease: "power2.in",
          },
        )
        .to(
          ".main-card",
          {
            width: isMobile ? "92vw" : "85vw",
            height: isMobile ? "92vh" : "85vh",
            borderRadius: isMobile ? "32px" : "40px",
            duration: 1.2,
            ease: "power2.inOut",
          },
          "<",
        )

        // 10. The call to action settles on top. This frame stays.
        .set(".hero-text-wrapper", { autoAlpha: 0 })
        .to(
          ".cta-wrapper",
          {
            autoAlpha: 1,
            scale: 1,
            duration: 0.9,
            ease: "power2.out",
          },
          "<+=0.5",
        )
        .to(
          ".scroll-hint",
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.5,
            ease: "power2.out",
          },
          ">-0.2",
        );

      // Jump straight to the finished frame with no animation. Used when a
      // visitor arrives already scrolled past the hero, or with reduced
      // motion, so the hero is never caught in a broken intermediate state.
      const finishInstantly = () => {
        hasStarted = true;
        hasCompleted = true;
        unlockScroll();
        cinematic.progress(1);

        // Already scrolled past the hero: keep the hint out of the way.
        if (window.scrollY > window.innerHeight * 0.7) {
          gsap.set(".scroll-hint", { autoAlpha: 0 });
        }
      };

      const handleFirstIntent = () => {
        if (hasStarted) {
          return;
        }

        // Arrived mid-page (scroll restore, anchor link): park on the final
        // frame instead of replaying the show from the top.
        if (window.scrollY > 4) {
          finishInstantly();

          return;
        }

        hasStarted = true;
        lockScroll();
        cinematic.play(0);
      };

      const handleScroll = () => {
        if (!hasStarted) {
          // Scrolled past the hero by other means (scrollbar drag, anchor
          // link, restore): skip the show and park on the final frame.
          if (window.scrollY > 4) {
            finishInstantly();
          }

          return;
        }

        if (hasCompleted) {
          // The hint only belongs to the hero, so fade it while the rest of
          // the page is on screen.
          const inHero = window.scrollY < window.innerHeight * 0.7;

          gsap.to(".scroll-hint", {
            autoAlpha: inHero ? 1 : 0,
            duration: 0.25,
            overwrite: "auto",
          });
        }
      };

      const handleKeyDown = (event: KeyboardEvent) => {
        const nextKeys = [
          "ArrowDown",
          "PageDown",
          " ",
          "Spacebar",
        ];

        if (nextKeys.includes(event.key)) {
          handleFirstIntent();
        }
      };

      if (window.scrollY > 4) {
        // Loaded mid-page (scroll restore, anchor link): skip the show.
        finishInstantly();
      } else if (prefersReducedMotion) {
        introTimeline.progress(1);
        finishInstantly();
      } else {
        window.addEventListener("wheel", handleFirstIntent, {
          passive: true,
        });
        window.addEventListener("touchmove", handleFirstIntent, {
          passive: true,
        });
        window.addEventListener("keydown", handleKeyDown);
      }

      window.addEventListener("scroll", handleScroll, {
        passive: true,
      });

      return () => {
        window.removeEventListener("wheel", handleFirstIntent);
        window.removeEventListener("touchmove", handleFirstIntent);
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("scroll", handleScroll);
        unlockScroll();
      };
    }, container);

    return () => context.revert();
  }, [metricValue]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex h-screen w-screen items-center justify-center overflow-hidden bg-background font-sans antialiased text-foreground",
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

      <div className="hero-text-wrapper transform-style-3d absolute z-10 flex w-screen flex-col items-center justify-center px-4 text-center will-change-transform">
        <h1 className="text-track gsap-reveal text-3d-matte mb-2 text-5xl font-bold tracking-tight md:text-7xl lg:text-[6rem]">
          {tagline1}
        </h1>

        <h1 className="text-days gsap-reveal text-silver-matte text-5xl font-extrabold tracking-tighter md:text-7xl lg:text-[6rem]">
          {tagline2}
        </h1>
      </div>

      <div className="start-hint pointer-events-none fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-1 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-foreground/60">
        <span>Scroll to see how it works</span>
        <span className="hint-arrow text-lg leading-none text-[#ef5f47]">
          ↓
        </span>
      </div>

      <div className="scroll-hint pointer-events-none fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-1 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">
        <span>Scroll down to keep exploring</span>
        <span className="hint-arrow text-lg leading-none text-[#d8f36a]">
          ↓
        </span>
      </div>

      <div className="cta-wrapper pointer-events-auto gsap-reveal absolute z-30 flex w-screen flex-col items-center justify-center px-4 text-center will-change-transform">
        <h2 className="text-card-silver-matte mb-6 text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
          {ctaHeading}
        </h2>

        <p className="mb-12 max-w-xl text-lg font-light leading-relaxed text-blue-100/70 md:text-xl">
          {ctaDescription}
        </p>

        <div className="flex flex-col gap-6 sm:flex-row">
          <a
            href={primaryCtaHref}
            className="btn-modern-light flex items-center justify-center gap-3 rounded-[1.25rem] px-8 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <span className="text-left">
              <span className="mb-[-2px] block text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                Your next step
              </span>
              <span className="block text-xl font-bold leading-none tracking-tight">
                {primaryCtaLabel}
              </span>
            </span>
          </a>

          <a
            href={secondaryCtaHref}
            className="btn-modern-dark flex items-center justify-center gap-3 rounded-[1.25rem] px-8 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <span className="text-left">
              <span className="mb-[-2px] block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Browse the
              </span>
              <span className="block text-xl font-bold leading-none tracking-tight">
                {secondaryCtaLabel}
              </span>
            </span>
          </a>
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
        style={{ perspective: "1500px" }}
      >
        <div
          ref={mainCardRef}
          className="main-card premium-depth-card pointer-events-auto relative flex h-[92vh] w-[92vw] items-center justify-center overflow-hidden rounded-[32px] md:h-[85vh] md:w-[85vw] md:rounded-[40px]"
        >
          <div className="card-sheen" aria-hidden="true" />

          <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col items-center justify-evenly px-4 py-6 lg:grid lg:grid-cols-3 lg:gap-8 lg:px-12 lg:py-0">
            <div className="card-right-text gsap-reveal order-1 z-20 flex w-full justify-center lg:order-3 lg:justify-end">
              <h2 className="text-card-silver-matte text-6xl font-black uppercase tracking-tighter md:text-[6rem] lg:mt-0 lg:text-[7rem]">
                {brandName}
              </h2>
            </div>

            <div
              className="mockup-scroll-wrapper relative z-10 order-2 flex h-[380px] w-full items-center justify-center lg:order-2 lg:h-[600px]"
              style={{ perspective: "1000px" }}
            >
              <div className="relative flex h-full w-full scale-[0.65] items-center justify-center md:scale-[0.85] lg:scale-100">
                <div
                  ref={mockupRef}
                  className="iphone-bezel transform-style-3d relative flex h-[580px] w-[280px] flex-col rounded-[3rem] will-change-transform"
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
                      <div className="phone-widget mb-8 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                            Today
                          </span>
                          <span className="text-xl font-bold tracking-tight text-white">
                            Your learning space
                          </span>
                        </div>

                        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-bold text-[#d8f36a]">
                          N
                        </div>
                      </div>

                      <div className="phone-widget relative mx-auto mb-8 flex h-44 w-44 items-center justify-center drop-shadow-[0_15px_25px_rgba(0,0,0,.8)]">
                        <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
                          <circle
                            cx="88"
                            cy="88"
                            r="64"
                            fill="none"
                            stroke="rgba(255,255,255,.03)"
                            strokeWidth="12"
                          />
                          <circle
                            className="progress-ring"
                            cx="88"
                            cy="88"
                            r="64"
                            fill="none"
                            stroke="#d8f36a"
                            strokeWidth="12"
                          />
                        </svg>

                        <div className="z-10 flex flex-col items-center text-center">
                          <span className="counter-val text-4xl font-extrabold tracking-tighter text-white">
                            0
                          </span>
                          <span className="mt-0.5 text-[8px] font-bold uppercase tracking-[.1em] text-[#d8f36a]/60">
                            {metricLabel}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="phone-widget widget-depth flex items-center rounded-2xl p-3">
                          <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-500/20 text-blue-400">
                            ✦
                          </div>
                          <div className="flex-1">
                            <div className="mb-2 h-2 w-24 rounded-full bg-neutral-300" />
                            <div className="h-1.5 w-16 rounded-full bg-neutral-600" />
                          </div>
                        </div>

                        <div className="phone-widget widget-depth flex items-center rounded-2xl p-3">
                          <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-500/20 text-emerald-400">
                            ✓
                          </div>
                          <div className="flex-1">
                            <div className="mb-2 h-2 w-20 rounded-full bg-neutral-300" />
                            <div className="h-1.5 w-28 rounded-full bg-neutral-600" />
                          </div>
                        </div>
                      </div>

                      <div className="absolute bottom-2 left-1/2 h-[4px] w-[120px] -translate-x-1/2 rounded-full bg-white/20" />
                    </div>
                  </div>
                </div>

                <div className="floating-badge floating-ui-badge absolute left-[-15px] top-6 z-30 flex items-center gap-3 rounded-xl p-3 lg:left-[-80px] lg:top-12 lg:gap-4 lg:rounded-2xl lg:p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-400/30 bg-blue-500/20 lg:h-10 lg:w-10">
                    <span className="text-base lg:text-xl" aria-hidden="true">
                      ✦
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-bold tracking-tight text-white lg:text-sm">
                      Clearer ideas
                    </p>
                    <p className="text-[10px] font-medium text-blue-200/50 lg:text-xs">
                      Just unlocked
                    </p>
                  </div>
                </div>

                <div className="floating-badge floating-ui-badge absolute bottom-12 right-[-15px] z-30 flex items-center gap-3 rounded-xl p-3 lg:bottom-20 lg:right-[-80px] lg:gap-4 lg:rounded-2xl lg:p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-indigo-400/30 bg-indigo-500/20 lg:h-10 lg:w-10">
                    <span className="text-base lg:text-lg" aria-hidden="true">
                      ✓
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-bold tracking-tight text-white lg:text-sm">
                      Practice ready
                    </p>
                    <p className="text-[10px] font-medium text-blue-200/50 lg:text-xs">
                      Made for you
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card-left-text gsap-reveal order-3 z-20 flex w-full max-w-none flex-col justify-center px-4 text-center lg:order-1 lg:px-0 lg:text-left">
              <h3 className="mb-0 text-2xl font-bold tracking-tight text-white md:text-3xl lg:mb-5 lg:text-4xl">
                {cardHeading}
              </h3>

              <p className="hidden max-w-sm text-sm font-normal leading-relaxed text-blue-100/70 md:block lg:max-w-none lg:text-lg">
                {cardDescription}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
