import { SignIn2 } from "@/components/ui/clean-minimal-sign-in";
import { useSearchParams } from "react-router";

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const redirectAfterAuth = returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")
    ? returnTo
    : "/dashboard";

  return <SignIn2 redirectAfterAuth={redirectAfterAuth} />;
}
