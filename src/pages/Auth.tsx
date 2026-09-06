import { FullAuthForm } from "@/components/ui/full-auth-form";
import { useAuth } from "@/hooks/use-auth";
import logo from "@/assets/logo.svg";
import { Suspense, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(
  returnTo: string | null,
  fallback = "/dashboard",
) {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const redirect = resolveRedirectAfterAuth(
    searchParams.get("returnTo"),
    redirectAfterAuth,
  );

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirect]);

  const handlePasswordSignIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await signIn("password", { email, password, flow: "signIn" });
      navigate(redirect);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpRequest = async (email: string) => {
    setIsLoading(true);
    try {
      await signIn("email-otp", { email });
      // Don't navigate here - the OTP form will handle the next step
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerify = async (email: string, code: string) => {
    setIsLoading(true);
    try {
      await signIn("email-otp", { email, code, flow: "email-verification" });
      navigate(redirect);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    await signIn("anonymous");
    navigate(redirect);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f8f5]">
      {/* Logo Header */}
      <div className="flex justify-center pt-8">
        <button type="button" onClick={() => navigate("/")} className="flex items-center gap-2.5">
          <img src={logo} alt="Notefox" className="h-10 w-10 rounded-[9px] bg-[#17201d]" />
          <span className="text-xl font-extrabold tracking-[-0.03em]">
            notefox<span className="text-[#ef5f47]">.</span>
          </span>
        </button>
      </div>

      {/* Auth Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-[420px]">
          <div className="bg-white rounded-2xl shadow-lg border border-[#17201d]/10 p-6">
            <FullAuthForm
              onPasswordSubmit={handlePasswordSignIn}
              onOtpRequest={handleOtpRequest}
              onOtpVerify={handleOtpVerify}
              isLoading={isLoading}
            />
          </div>

          {/* Guest login option */}
          <div className="mt-4 text-center">
            <span className="text-sm text-muted-foreground">or </span>
            <button
              type="button"
              onClick={handleGuestLogin}
              className="text-sm text-[#ef5f47] font-medium hover:underline"
            >
              Continue as Guest
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-4 text-center text-xs text-muted-foreground">
        Secured by{" "}
        <a
          href="https://freebuff.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-primary transition-colors"
        >
          freebuff.com
        </a>
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}