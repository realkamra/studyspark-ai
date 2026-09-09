# Gratter

**Gratter** is a modern learning platform that transforms your notes into complete study kits — study guides, flashcards, practice tests, interactive games, and video suggestions. Built with Vite + React 19 + TypeScript + Convex.

## ✨ Features

- **🎯 Study Guides** — Structured guides with summaries, sections, and bullet points
- **🔁 Flashcards** — 3D flip animations, spaced repetition ready, keyboard accessible
- **📝 Practice Tests** — Multiple choice questions with instant feedback and explanations
- **🎮 Interactive Games** — Matching pairs, Memory (concentration), Fill-in-the-blank
- **📺 Video Suggestions** — Curated YouTube/Google search links for each topic
- **🤖 AI Generation** — Powered by OpenRouter (free tier models available)
- **🔒 Mock Fallback** — Works without API key using deterministic template generation
- **♿ Accessible** — WCAG AA, keyboard navigation, ARIA live regions, reduced motion
- **📱 Mobile-First** — Responsive design, touch targets ≥44px, hamburger menus

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Vite, React 19, TypeScript, React Router 7 (HashRouter) |
| **Styling** | Tailwind CSS v4, CSS Variables, Custom Design System |
| **UI Primitives** | Radix UI, Sonner (toasts), Lucide Icons |
| **Animations** | Framer Motion (Emil Kowalski design engineering principles) |
| **Backend** | Convex (real-time DB, auth, serverless functions) |
| **Auth** | Convex Auth (email OTP, anonymous/guest) |
| **AI** | OpenRouter (DeepSeek, Llama, GPT, Claude models) |
| **Package Manager** | Bun |

---

## 🚀 Quick Start

### Prerequisites

- **Bun** ≥ 1.1 (or Node.js ≥ 20 + pnpm/npm)
- **Convex Account** — [convex.dev](https://convex.dev) (free tier works)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd gratter
bun install
```

### 2. Set Up Convex

```bash
# Login to Convex (opens browser)
bunx convex login

# Create a new Convex project (or select existing)
bunx convex dev
```

This creates `.env.local` with `CONVEX_DEPLOYMENT` and `VITE_CONVEX_URL`.

### 3. Configure Environment (Optional)

```bash
cp .env.example .env.local
```

Edit `.env.local` to add your **OpenRouter API key** for AI generation:

```env
AI_API_KEY=sk-or-v1-xxxxxxxxxxxxx
# Or use the alternative name
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
```

> **No API key?** Gratter works out of the box with a deterministic mock generator that creates realistic study kits from your notes.

### 4. Run Development Server

```bash
bun run dev
```

Open http://localhost:5173

---

## 📁 Project Structure

```
src/
├── assets/                 # Logo, static assets
├── components/
│   ├── study/              # Study mode components
│   │   ├── FlashcardDeck.tsx
│   │   ├── PracticeTest.tsx
│   │   ├── StudyGuideRenderer.tsx
│   │   ├── MatchingGame.tsx      # NEW: Click-to-match term/definition
│   │   ├── MemoryGame.tsx        # NEW: Concentration game
│   │   ├── FillInBlank.tsx       # NEW: Cloze deletion
│   │   └── VideoSuggestions.tsx  # NEW: YouTube/Google search links
│   ├── ui/                 # Radix-based UI primitives (button, tabs, etc.)
│   └── ...
├── convex/
│   ├── ai/
│   │   ├── generate.ts     # AI study kit generation (with mock fallback)
│   │   ├── parse.ts        # JSON parsing & validation
│   │   └── prompts.ts      # System/user prompts
│   ├── auth/               # Convex Auth (email OTP, anonymous)
│   ├── materials.ts        # CRUD + generation mutations
│   └── schema.ts           # Database schema
├── hooks/
│   └── use-auth.ts         # Auth state hook
├── lib/
│   └── library-data.ts     # Curated library content
├── pages/
│   ├── Landing.tsx         # Marketing landing page (mockup-matched)
│   ├── Auth.tsx            # Login/register/guest
│   ├── Dashboard.tsx       # Workspace (overview, library, uploads)
│   ├── CreateMaterial.tsx  # Paste notes → generate kit
│   ├── MaterialDetail.tsx  # Study kit tabs (guide, flashcards, quiz, games, videos)
│   ├── Library.tsx         # Public library browser
│   ├── LibraryDetail.tsx   # Library item preview
│   └── NotFound.tsx
├── types/
│   └── study.ts            # StudyKit, Flashcard, QuizQuestion, GamePair types
├── index.css               # Gratter design system (CSS variables, easings, colors)
├── main.tsx                # App entry, router, providers
└── vite-env.d.ts
```

---

## 🎨 Design System (Gratter Palette)

Defined in `src/index.css` as CSS variables:

```css
:root {
  /* Core */
  --background: #FFFFFF;           /* White */
  --surface: #F8FAFC;              /* Light slate */
  --navy-ink: #0F172A;             /* Deep navy headings */
  
  /* Primary */
  --primary: #2563EB;              /* Royal blue */
  --primary-hover: #1D4ED8;        /* Darker blue */
  
  /* Accent */
  --mint-500: #34D399;             /* Mint green (on dark bg only) */
  --mint-600: #059669;             /* Emerald-600 (on light bg - WCAG AA) */
  --mint-100: #D1FAE5;             /* Soft mint bg */
  
  /* Status */
  --success: #10B981;
  --warning: #F59E0B;
  --destructive: #EF4444;
  
  /* Borders */
  --border: #E2E8F0;
  
  /* Radius */
  --radius: 0.75rem;
  
  /* Custom Easings (Emil Kowalski) */
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
  
  /* Press feedback */
  --press-scale: 0.97;
  --press-duration: 160ms;
  
  /* Stagger */
  --stagger-delay: 30ms;
}
```

**Contrast Note**: Mint `#34D399` fails AA on white (2.3:1). Use `--mint-600` (`#059669`) for text on light backgrounds. Mint 500 only on dark (navy) backgrounds.

---

## 🧪 Animations (Emil Kowalski Principles)

| Interaction | Enter | Exit | Easing | Duration | Notes |
|-------------|-------|------|--------|----------|-------|
| Landing hero | `@starting-style` opacity + translateY | N/A | `--ease-out` | 400-600ms | Stagger 50ms |
| Button press | N/A | N/A | `ease-out` | 160ms | `scale(0.97)` on `:active` |
| Card hover | `translateY(-4px)` + shadow | `translateY(0)` | `--ease-out` | 200ms | `@media (hover: hover)` |
| Tab switch | Crossfade | Crossfade | `--ease-in-out` | 200ms | Hardware accelerated |
| Flashcard flip | `rotateY(180deg)` | `rotateY(0)` | `--ease-in-out` | 500ms | `preserve-3d` |
| Toast | `translateY(-100%)` | `translateY(0)` | `--ease-out` | 400ms | CSS transitions |
| Modal/drawer | `scale(0.95)` + opacity | `scale(0.95)` + opacity | `--ease-drawer` | 300ms | Origin-aware |
| Game match | Pulse scale + color | N/A | `--ease-out` | 300ms | `aria-live` announce |
| Stagger (grids) | opacity + translateY(8px) | N/A | `--ease-out` | 300ms | 30-50ms delay/item |

**Hardware acceleration**: Use `transform: "translateX()"` strings in Framer Motion, not `x`/`y` props.

**Reduced motion**: All animations respect `prefers-reduced-motion` — keep opacity/color, remove transform motion.

---

## 🔐 Authentication

Convex Auth with three flows:

1. **Email OTP** — Magic link / code sent to email
2. **Password** — Traditional email/password
3. **Anonymous/Guest** — No signup required, data persisted locally

Protected routes use `RequireAuth` wrapper and `useAuth()` hook.

---

## 🤖 AI Generation Pipeline

```
User Notes → createMaterial mutation → generateStudyKit action
                                        ↓
                              ┌─────────┴─────────┐
                              │                   │
                    AI_API_KEY set?           No API key
                              │                   │
                              ▼                   ▼
                      OpenRouter API         generateMockKit()
                      (DeepSeek/Llama)          (deterministic)
                              │                   │
                              └─────────┬─────────┘
                                        ▼
                              parseStudyKit() validation
                                        │
                              ┌─────────┴─────────┐
                              │                   │
                            Valid               Invalid
                              │                   │
                              ▼                   ▼
                      finishGeneration      failGeneration (retry once)
```

**Mock generator** (`generateMockKit`) creates deterministic, realistic study kits based on source text — perfect for demos and development.

---

## ♿ Accessibility Checklist

- [x] Skip-to-content link on all pages
- [x] Visible `:focus-visible` outlines (2px primary ring)
- [x] ARIA labels on all icon-only buttons
- [x] `aria-live="polite"` on game announcements, quiz feedback, flashcard flips
- [x] Semantic heading hierarchy (h1 → h2 → h3)
- [x] `role="list"` / `role="listitem"` on game grids
- [x] `aria-pressed`, `aria-selected`, `aria-disabled` on interactive cards
- [x] Keyboard navigation: Tab, Enter, Space, Arrow keys, Escape
- [x] `prefers-reduced-motion` respected (transforms disabled, opacity/color kept)
- [x] WCAG AA contrast: Navy on white (13.6:1), Primary on white (4.5:1), Mint-600 on white (4.5:1)
- [x] Touch targets ≥ 44×44px
- [x] `target="_blank" rel="noopener noreferrer"` on external links

---

## 📱 Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| Mobile | < 640px | Single column, hamburger nav, stacked hero, 1-col grids |
| Tablet | 640–1024px | 2-col grids, visible nav (condensed), side-by-side hero |
| Desktop | ≥ 1024px | 3-col grids, full nav, sidebar on dashboard, 4-col benefits |

---

## 🧑‍💻 Development

### Commands

```bash
# Dev server with hot reload
bun run dev

# Type check
bun run typecheck

# Lint
bun run lint

# Build for production
bun run build

# Preview production build
bun run preview

# Convex dashboard
bunx convex dashboard

# Deploy Convex functions
bunx convex deploy
```

### Adding a New Page

1. Create component in `src/pages/YourPage.tsx`
2. Add route in `src/main.tsx`
3. Use design system classes from `src/index.css`
4. Wrap in `<main className="min-h-dvh bg-white text-navy-ink">`

### Adding a Study Component

1. Create in `src/components/study/YourComponent.tsx`
2. Import types from `src/types/study.ts`
3. Use `useReducedMotion()` for animation gating
4. Add to `MaterialDetail.tsx` tabs

---

## 🚢 Deployment

### GitHub Pages (Static Preview)

The repo includes `.github/workflows/deploy-pages.yml`. The landing page and library work without Convex.

1. Push to GitHub
2. Settings → Pages → Source: GitHub Actions
3. Add `VITE_CONVEX_URL` as repository variable for auth on preview

### Full Deployment (Vercel/Netlify + Convex)

1. Deploy Convex: `bunx convex deploy --prod`
2. Set production env vars in hosting platform
3. Deploy frontend (auto-detects Vite)

---

## 📄 License

MIT — feel free to use for learning or commercial projects.

---

## 🙏 Credits

- **Design Engineering**: Emil Kowalski ([animations.dev](https://animations.dev/))
- **Icons**: Lucide
- **UI Primitives**: Radix UI
- **Backend**: Convex
- **AI**: OpenRouter