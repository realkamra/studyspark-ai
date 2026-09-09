import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, FileText, Loader2, Sparkles, Wand2, Lightbulb } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";

const exampleNotes = `Project Management Fundamentals

A project is a temporary endeavor undertaken to create a unique product, service, or result. It has a defined beginning and end, scope, and resources.

Key Concepts:
- Project Lifecycle: Initiation, Planning, Execution, Monitoring & Controlling, Closure
- Triple Constraint: Scope, Time, Cost (Quality is affected by all three)
- Stakeholders: Anyone impacted by the project (sponsors, team, customers, vendors)
- Project Charter: Formal document authorizing the project

Planning Phase:
1. Define scope and objectives
2. Create Work Breakdown Structure (WBS)
3. Develop schedule with milestones
4. Identify risks and mitigation strategies
5. Establish communication plan

Risk Management:
- Identify: Brainstorming, checklists, SWOT analysis
- Assess: Probability × Impact matrix
- Respond: Avoid, Mitigate, Transfer, Accept
- Monitor: Regular risk reviews

Agile vs Waterfall:
- Waterfall: Sequential phases, fixed scope, predictable
- Agile: Iterative, flexible scope, adaptive to change
- Hybrid: Combining both approaches for complex projects

Tools: Gantt charts, Kanban boards, RACI matrix, burndown charts`;

export default function CreateMaterial() {
  const navigate = useNavigate();
  const createMaterial = useMutation(api.materials.createMaterial);
  const reduceMotion = useReducedMotion();

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = title.trim().length > 0 && notes.trim().length >= 8 && !submitting;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const id = await createMaterial({
        title: title.trim(),
        sourceType: "text",
        sourceText: notes.trim(),
        accent: "mint",
      });
      navigate(`/dashboard/materials/${id}`);
    } catch (error: unknown) {
      // Surface whatever Convex / network actually threw.
      // ConvexError extends Error — .data holds the thrown value, .message mirrors it when string.
      // But network / auth / JSON-validation errors use different shapes, so try every path.
      let message: string | undefined;
      if (typeof error === "string") {
        message = error;
      } else if (error instanceof Error) {
        const maybeData = (error as unknown as { data?: unknown }).data;
        if (typeof maybeData === "string" && maybeData.trim()) message = maybeData;
        else if (maybeData != null) {
          try {
            message = JSON.stringify(maybeData);
          } catch {
            message = String(maybeData);
          }
        } else if (error.message && error.message !== "An error occurred.") {
          message = error.message;
        }
      } else if (error !== null && typeof error === "object") {
        const maybeData = (error as { data?: unknown }).data;
        const maybeMsg = (error as { message?: unknown }).message;
        if (typeof maybeData === "string" && maybeData.trim()) message = maybeData;
        else if (typeof maybeMsg === "string" && maybeMsg.trim()) message = maybeMsg;
      }
      // `console.error` so the browser devtools / Convex dashboard shows the raw shape too.
      // eslint-disable-next-line no-console
      console.error("[createMaterial] suppressed error:", error);
      toast.error("Couldn't create that material", {
        description:
          message ?? "Something went wrong creating that material. Please try again.",
      });
      setSubmitting(false);
    }
  };

  const handleExampleNotes = () => {
    setTitle("Project Management Essentials");
    setNotes(exampleNotes);
  };

  return (
    <main className="min-h-dvh bg-white text-navy-ink selection:bg-primary selection:text-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-primary"
      >
        Skip to main content
      </a>

      <div className="mx-auto flex min-h-dvh max-w-7xl flex-col px-5 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="pressable inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 hover:text-navy-ink hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            Dashboard
          </button>
        </div>

        <div className="grid flex-1 items-start gap-10 pb-10 pt-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:pb-16 lg:pt-16">
          <motion.header
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
            style={{ animationDuration: reduceMotion ? "0.01ms" : "450ms" }}
            className="max-w-[440px] lg:sticky lg:top-10"
          >
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="h-4 w-4" strokeWidth={2} />
              New study kit
            </p>
            <h1 className="mt-4 text-5xl font-semibold leading-[1.0] tracking-tight text-navy-ink sm:text-6xl">
              Paste your notes,<br />get a complete study kit.
            </h1>
            <p className="mt-6 max-w-[390px] text-base leading-7 text-slate-600">
              Drop in your class notes — any subject. Gratter turns them into a study guide,
              flashcards, practice tests, interactive games, and video suggestions.
            </p>
            <div className="mt-10 hidden border-t border-slate-200 pt-5 text-xs leading-5 text-slate-500 sm:block">
              <p className="font-semibold text-navy-ink">A focused starting point</p>
              <p className="mt-1 max-w-[280px]">Give the material a name, then include enough context for the kit to make useful connections.</p>
            </div>
          </motion.header>

          <motion.form
            onSubmit={handleSubmit}
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.45, delay: 0.06, ease: [0.23, 1, 0.32, 1] }}
            style={{ animationDuration: reduceMotion ? "0.01ms" : "450ms" }}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Build a resource</p>
                <p className="mt-1 text-sm font-semibold text-navy-ink">Start with the source material</p>
              </div>
              <span className="text-xs font-semibold tabular-nums text-slate-500">01 / 01</span>
            </div>

            <div className="mt-7 space-y-7">
              <label className="block">
                <span className="text-xs font-semibold text-slate-500">Give it a name</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="For example, Project Management Essentials"
                  className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm text-navy-ink outline-none placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 pressable"
                />
              </label>

              <label className="block">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-xs font-semibold text-slate-500">Paste your notes</span>
                  <span className="text-xs text-slate-400">{notes.length.toLocaleString()} / 60,000</span>
                </div>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Paste your class notes, textbook chapter, study sheet…"
                  maxLength={60_000}
                  className="mt-2 min-h-72 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-navy-ink outline-none placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 pressable"
                />
              </label>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Or try with an example</span>
                <button
                  type="button"
                  onClick={handleExampleNotes}
                  className="pressable inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:border-primary hover:text-primary hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Lightbulb className="h-4 w-4" strokeWidth={2} />
                  Example notes
                </button>
              </div>
            </div>

            <div className="mt-8 border-t border-slate-200 pt-6">
              <button
                type="submit"
                disabled={!canSubmit}
                className="pressable inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:shadow-md hover:shadow-primary/25 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 disabled:hover:bg-primary disabled:hover:shadow-sm sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Creating…
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" strokeWidth={2} />
                    Generate my study kit
                    <ArrowRight className="h-4 w-4" strokeWidth={2} />
                  </>
                )}
              </button>
              <p className="mt-5 flex items-center gap-2 text-xs font-medium leading-5 text-slate-500">
                <FileText className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                Your notes stay private to your account and are only used to build your kit.
              </p>
            </div>
          </motion.form>
        </div>
      </div>
    </main>
  );
}