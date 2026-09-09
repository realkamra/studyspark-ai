import "@vly-ai/integrations";
import { Toaster } from "@/components/ui/sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { InstrumentationProvider } from "@/instrumentation.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { StrictMode, useEffect, lazy, Suspense, Component, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import {
  HashRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router";
import "./index.css";
import "./types/global.d.ts";

const VlyToolbar = lazy(() =>
  import("../vly-toolbar-readonly.tsx").then(({ VlyToolbar }) => ({
    default: VlyToolbar,
  })),
);

const Landing = lazy(() => import("./pages/Landing.tsx"));
const AuthPage = lazy(() => import("./pages/Auth.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const CreateMaterial = lazy(() => import("./pages/CreateMaterial.tsx"));
const MaterialDetail = lazy(() => import("./pages/MaterialDetail.tsx"));
const Library = lazy(() => import("./pages/Library.tsx"));
const LibraryDetail = lazy(() => import("./pages/LibraryDetail.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Demo = lazy(() => import("./demo.tsx"));
const SkyboundDemo = lazy(() => import("./pages/SkyboundDemoPage.tsx"));

function RouteLoading() {
  return (
    <main
      className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="size-2 rounded-full bg-primary" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">Loading your workspace…</p>
      </div>
    </main>
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-background px-6 text-center text-foreground">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-7 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Unexpected pause
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">Something went wrong</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              The page failed to load. Try refreshing this view.
            </p>
            <p className="mt-5 break-words rounded-lg border border-border bg-muted/60 px-4 py-3 text-left font-mono text-xs text-muted-foreground">
              {this.state.error.message}
            </p>
            <button
              type="button"
              onClick={() => this.setState({ error: null })}
              className="mt-6 inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-[transform,background-color,box-shadow] duration-150 ease-[var(--ease-out)] hover:bg-primary/90 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Try again
            </button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}

const isVlyHost =
  typeof window !== "undefined" &&
  window.location.hostname.endsWith(".vly.sh");

const convexUrl = import.meta.env.VITE_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

function StaticPreviewNotice() {
  const navigate = useNavigate();

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-center text-foreground">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-7 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          GitHub Pages preview
        </p>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          The visual preview is ready.
        </h1>

        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Sign-in and the workspace are available when the GitHub repository has
          a VITE_CONVEX_URL variable configured.
        </p>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="min-h-10 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-[transform,background-color,box-shadow] duration-150 ease-[var(--ease-out)] hover:bg-primary/90 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Back home
          </button>

          <button
            type="button"
            onClick={() => navigate("/library")}
            className="min-h-10 rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition-[transform,background-color,border-color] duration-150 ease-[var(--ease-out)] hover:bg-accent active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Explore library
          </button>
        </div>
      </div>
    </main>
  );
}

function RouteSyncer() {
  const location = useLocation();

  useEffect(() => {
    window.parent.postMessage(
      {
        type: "iframe-route-change",
        path: location.pathname + location.hash,
      },
      window.location.origin,
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") {
          window.history.back();
        }

        if (event.data.direction === "forward") {
          window.history.forward();
        }
      }
    }

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return null;
}

function AppRoutes() {
  const protectedRoutes = convex ? (
    <>
      <Route
        path="/auth"
        element={<AuthPage />}
      />

      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />

      <Route
        path="/dashboard/new"
        element={
          <RequireAuth>
            <CreateMaterial />
          </RequireAuth>
        }
      />

      <Route
        path="/dashboard/materials/:id"
        element={
          <RequireAuth>
            <MaterialDetail />
          </RequireAuth>
        }
      />
    </>
  ) : (
    <>
      <Route path="/auth" element={<StaticPreviewNotice />} />
      <Route path="/dashboard" element={<StaticPreviewNotice />} />
    </>
  );

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/library" element={<Library />} />
      <Route path="/library/:itemId" element={<LibraryDetail />} />
      <Route path="/demo/signin" element={<Demo />} />
      <Route path="/demo/skybound" element={<SkyboundDemo />} />
      {protectedRoutes}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {isVlyHost && (
      <Suspense fallback={null}>
        <VlyToolbar />
      </Suspense>
    )}

    <InstrumentationProvider>
      <HashRouter>
        <RouteSyncer />

        <ErrorBoundary>
        <Suspense fallback={<RouteLoading />}>
          {convex ? (
            <ConvexAuthProvider client={convex}>
              <AppRoutes />
            </ConvexAuthProvider>
          ) : (
            <AppRoutes />
          )}
        </Suspense>
        </ErrorBoundary>

        <Toaster />
      </HashRouter>
    </InstrumentationProvider>
  </StrictMode>,
);