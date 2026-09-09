import { ArrowLeft, SearchX } from "lucide-react";
import { useNavigate } from "react-router";
import logo from "@/assets/logo.svg";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <main className="min-h-[100dvh] bg-white text-navy-ink selection:bg-primary selection:text-white">
      <div className="mx-auto flex min-h-[100dvh] max-w-[1240px] flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2.5 rounded-lg pressable focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4"
          >
            <div className="flex items-center justify-center h-8 w-8 rounded-[10px] bg-navy-ink">
              <span className="flex h-3 w-3 rounded-full bg-mint-500" aria-hidden="true" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-navy-ink">
              Gratter
            </span>
          </button>
        </header>

        <section className="flex flex-1 items-center justify-center py-20">
          <div className="grid w-full max-w-[760px] gap-10 sm:grid-cols-[0.6fr_1fr] sm:items-center">
            <div className="flex h-36 w-36 items-center justify-center rounded-[28px] bg-navy-ink text-white sm:h-48 sm:w-48">
              <SearchX className="h-16 w-16 text-primary" strokeWidth={1.4} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                404
              </p>
              <h1 className="mt-4 text-5xl font-semibold leading-[0.92] tracking-[-0.075em] sm:text-6xl text-navy-ink">
                This page is not in the kit.
              </h1>
              <p className="mt-5 max-w-[32rem] text-base leading-7 text-slate-600">
                The address may be outdated, or the resource may have moved. Start again from the dashboard or browse the library.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="inline-flex items-center gap-2 rounded-[12px] bg-primary px-5 py-3.5 text-sm font-semibold text-white pressable hover:shadow-lg hover:shadow-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
                  Back home
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/library")}
                  className="rounded-[12px] border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-navy-ink pressable hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  Browse library
                </button>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-slate-200 py-6 text-xs font-medium text-slate-500">
          Gratter — Learn Anytime, Anywhere
        </footer>
      </div>
    </main>
  );
}
