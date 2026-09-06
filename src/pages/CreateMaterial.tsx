import { ArrowLeft, ArrowRight, FileText, Loader2, Sparkles, Wand2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";
import logo from "@/assets/logo.svg";

const ACCENTS = ["lime", "coral", "blue"] as const;

export default function CreateMaterial() {
  const navigate = useNavigate();
  const createMaterial = useMutation(api.materials.createMaterial);

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [accent, setAccent] = useState<(typeof ACCENTS)[number]>("lime");
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
        accent,
      });
      navigate(`/dashboard/materials/${id}`);
    } catch {
      toast.error("Couldn't create that material", {
        description: "Give it a title and at least a little bit of notes to study.",
      });
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#17201d]">
      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 lg:py-12">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => navigate("/dashboard")} className="inline-flex items-center gap-2 text-sm font-bold text-[#68736c] transition-colors hover:text-[#17201d]">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </button>
          <img src={logo} alt="Notefox mark" className="h-8 w-8 rounded-[9px] bg-[#17201d] lg:hidden" />
        </div>

        <header className="mt-8">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#ef5f47]">
            <Sparkles className="h-4 w-4" /> New study kit
          </p>
          <h1 className="mt-2 text-4xl font-extrabold leading-[0.98] tracking-[-0.05em] sm:text-5xl">
            Paste your notes,<br />get a full study kit.
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-[#68736c]">
            Drop in your class notes — any subject. StudySpark turns them into a visual study guide,
            flashcards, a practice test, and a review game. Comes out in about half a minute.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="mt-9 space-y-5">
          <label className="block">
            <span className="text-xs font-bold text-[#68736c]">Give it a name</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="For example, Photosynthesis — Chapter 4"
              className="mt-2 h-12 w-full rounded-xl border border-[#17201d]/15 bg-white px-4 text-sm outline-none focus:border-[#17201d]/35 focus:ring-2 focus:ring-[#d8f36a]"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold text-[#68736c]">Paste your notes</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Paste the class notes, your textbook chapter, a study sheet…"
              maxLength={60_000}
              className="mt-2 min-h-64 w-full resize-y rounded-xl border border-[#17201d]/15 bg-white p-4 text-sm leading-6 outline-none focus:border-[#17201d]/35 focus:ring-2 focus:ring-[#d8f36a]"
            />
          </label>

          <div>
            <span className="text-xs font-bold text-[#68736c]">Snag a color</span>
            <div className="mt-2 flex gap-2.5">
              {ACCENTS.map((accentName) => (
                <button
                  type="button"
                  key={accentName}
                  onClick={() => setAccent(accentName)}
                  aria-label={`${accentName} accent`}
                  className={`h-9 w-9 rounded-xl border-2 transition-transform ${
                    accent === accentName ? "scale-110" : "opacity-60 hover:opacity-100"
                  } ${
                    accentName === "lime"
                      ? "border-[#a9cf3f] bg-[#d8f36a]"
                      : accentName === "coral"
                        ? "border-[#e06a4e] bg-[#ff967f]"
                        : "border-[#6d88d8] bg-[#9eb8ff]"
                  }`}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#17201d] px-5 py-4 text-sm font-bold text-white shadow-[0_3px_0_#0c100e] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 sm:w-auto"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            {submitting ? "Creating…" : "Cook up my study kit"}
            {!submitting && <ArrowRight className="h-4 w-4" />}
          </button>

          <p className="flex items-center gap-2 text-[11px] font-bold text-[#87908a]">
            <FileText className="h-3.5 w-3.5" />
            Your notes stay private to your account and are only used to build your kit.
          </p>
        </form>
      </div>
    </main>
  );
}