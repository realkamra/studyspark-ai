import "@vly-ai/integrations";
import { Toaster } from "@/components/ui/sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { InstrumentationProvider } from "@/instrumentation.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { StrictMode, useEffect, lazy, Suspense } from "react";
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
const Library = lazy(() => import("./pages/Library.tsx"));
const LibraryDetail = lazy(() => import("./pages/LibraryDetail.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

function RouteLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}

const isVlyHost =
  typeof window !== "undefined" &&
  window.location.hostname.endsWith(".vly.sh");

const convexUrl = import.meta.env.VITE_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

function StaticPreviewNotice() {
  const navigate = useNavigate();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8f5] px-5 text-center text-[#17201d]">
      <div className="max-w-md">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#ef5f47]">
          GitHub Pages preview
        </p>

        <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
          The visual preview is ready.
        </h1>

        <p className="mt-3 text-sm leading-6 text-[#68736c]">
          Sign-in and the workspace are available when the GitHub repository has
          a VITE_CONVEX_URL variable configured.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="rounded-xl bg-[#17201d] px-4 py-3 text-sm font-bold text-white"
          >
            Back home
          </button>

          <button
            type="button"
            onClick={() => navigate("/library")}
            className="rounded-xl border border-[#17201d]/15 bg-white px-4 py-3 text-sm font-bold"
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
        path: location.pathname,
      },
      "*",
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
        element={<AuthPage redirectAfterAuth="/dashboard" />}
      />

      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <Dashboard />
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

        <Suspense fallback={<RouteLoading />}>
          {convex ? (
            <ConvexAuthProvider client={convex}>
              <AppRoutes />
            </ConvexAuthProvider>
          ) : (
            <AppRoutes />
          )}
        </Suspense>

        <Toaster />
      </HashRouter>
    </InstrumentationProvider>
  </StrictMode>,
);