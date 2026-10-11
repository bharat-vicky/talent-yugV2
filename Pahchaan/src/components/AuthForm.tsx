"use client";
import { Suspense, useEffect, useState } from "react";
import { getProviders, signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { safeAuthDestination } from "@/lib/auth-navigation";

const errors: Record<string, string> = {
  AccountLinkRequired:
    "Google could not safely link to this existing account. Sign in with your password or use account recovery.",
  AccountUnavailable:
    "We could not finish signing you in. Please try again shortly or contact support.",
  AccessDenied:
    "Sign-in could not be completed. Use a verified Google email, or sign in with your password.",
  CredentialsSignin:
    "Email or password is incorrect. Please try again, or create an account if you’re new here.",
  OAuthSignin: "Could not connect to Google. Please try again.",
  OAuthCallback:
    "Google sign-in could not be completed. Start again from this page.",
  OAuthAccountNotLinked:
    "Use the sign-in method you originally used for this account.",
  Configuration: "Sign-in is temporarily unavailable. Please contact support.",
  TooManyAttempts:
    "Too many sign-in attempts. Please wait 10 minutes and try again.",
};
function Form({ signup }: { signup: boolean }) {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState<"email" | "google" | null>(null);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [google, setGoogle] = useState(false);
  useEffect(() => {
    let active = true;
    getProviders()
      .then((p) => {
        if (active) setGoogle(!!p?.google);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  const code = params.get("error");
  const error =
    message ||
    (code
      ? errors[code] || "Sign-in could not be completed. Please try again."
      : "");
  function destination() {
    return safeAuthDestination(
      params.get("callbackUrl"),
      window.location.origin,
    );
  }
  async function googleSignIn() {
    if (busy) return;
    setBusy("google");
    setMessage("");
    try {
      await signIn("google", { callbackUrl: destination() });
    } catch {
      setMessage("Could not connect to Google. Please try again.");
      setBusy(null);
    }
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setMessage("");
    if (!signup && new TextEncoder().encode(password).length > 72) {
      setMessage(
        "Password is too long. Use at most 72 bytes; emoji and some letters use more than one byte.",
      );
      return;
    }
    setBusy("email");
    try {
      if (signup) {
        const r = await fetch("/pahchaan/api/account/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
        });
        const data = await r.json();
        if (!r.ok)
          setMessage(
            r.status === 429
              ? "Too many attempts. Please wait before trying again."
              : r.status === 503
                ? data.code === "DATABASE_UNAVAILABLE"
                  ? "The service is temporarily unavailable. Please try again shortly."
                  : "Email signup is temporarily unavailable. Use Google sign-in or contact support."
                : "Could not complete signup. Please try again shortly.",
          );
        else {
          setSent(true);
          setPassword("");
        }
      } else {
        const r = await signIn("credentials", {
          email: email.trim(),
          password,
          redirect: false,
          callbackUrl: destination(),
        });
        if (!r?.ok || r.error) {
          setMessage(
            r?.error
              ? errors[r.error] || errors.AccountUnavailable
              : errors.AccountUnavailable,
          );
        } else
          window.location.assign(
            safeAuthDestination(r.url, window.location.origin),
          );
      }
    } catch {
      setMessage("Could not connect. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  }
  if (sent)
    return (
      <div className="space-y-6" role="status">
        <ShieldCheck className="size-10 text-primary" aria-hidden="true" />
        <h1 className="text-4xl font-heading">Check your inbox.</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          For a new or unverified email address, we send a verification link.
          Check your spam folder too. The link expires in 30 minutes. Open it to
          verify your email and choose your password.
        </p>
        <p className="text-sm">
          Already verified this address or used Google to sign up? We won’t send
          another signup email. Sign in instead, or use account recovery to set
          or reset your password.
        </p>
        <div className="flex flex-wrap gap-5 text-sm underline underline-offset-4">
          <Link href="/login">Sign in</Link>
          <Link href="/verify-email">Resend verification</Link>
          <Link href="/forgot-password">Recover account</Link>
        </div>
      </div>
    );
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
          Your space for better gatherings
        </p>
        <h1 className="font-heading text-4xl tracking-tight">
          {signup ? "A thoughtful beginning." : "Welcome back."}
        </h1>
        <p className="text-sm text-muted-foreground mt-3">
          {signup
            ? "Continue with Google, or verify your email and choose a password."
            : "Sign in to pick up where you left off."}
        </p>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </p>
      )}
      {google && (
        <>
          <Button
            variant="outline"
            className="h-12 rounded-xl"
            disabled={!!busy}
            onClick={googleSignIn}
          >
            {busy === "google" && (
              <Loader2 className="mr-2 size-4 animate-spin" />
            )}
            Continue with Google
          </Button>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or use your email
            <span className="h-px flex-1 bg-border" />
          </div>
        </>
      )}
      <form onSubmit={submit} className="space-y-5" aria-busy={!!busy}>
        <div className="space-y-2">
          <Label htmlFor="auth-email">Email address</Label>
          <Input
            id="auth-email"
            name="email"
            type="email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={254}
            required
            disabled={!!busy}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-12 rounded-xl"
          />
        </div>
        {!signup && (
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="auth-password">Password</Label>
              {!signup && (
                <Link
                  href="/forgot-password"
                  className="text-xs underline underline-offset-4"
                >
                  Forgot password?
                </Link>
              )}
            </div>
            <div className="relative">
              <Input
                id="auth-password"
                name="password"
                type={visible ? "text" : "password"}
                autoComplete={signup ? "new-password" : "current-password"}
                minLength={signup ? 12 : undefined}
                required
                disabled={!!busy}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-describedby={signup ? "password-help" : undefined}
                className="h-12 rounded-xl pr-12"
              />
              <button
                type="button"
                onClick={() => setVisible(!visible)}
                aria-label={visible ? "Hide password" : "Show password"}
                aria-pressed={visible}
                className="absolute right-1 top-1 flex size-10 items-center justify-center rounded-lg hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary"
              >
                {visible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {signup && (
              <p id="password-help" className="text-xs text-muted-foreground">
                Use at least 12 characters. Choose a long, unique passphrase.
              </p>
            )}
          </div>
        )}
        <Button
          type="submit"
          disabled={!!busy}
          className="w-full h-12 rounded-xl"
        >
          {busy === "email" && <Loader2 className="mr-2 size-4 animate-spin" />}
          {signup ? "Continue with email" : "Sign in"}
        </Button>
      </form>
      {signup && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline">
            Privacy Policy
          </Link>
          .
        </p>
      )}
      <p className="text-sm text-center text-muted-foreground">
        {signup ? "Already have an account?" : "New to Pahchaan?"}{" "}
        <Link
          href={signup ? "/login" : "/signup"}
          className="font-semibold text-primary underline underline-offset-4"
        >
          {signup ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}
export default function AuthForm({ signup = false }: { signup?: boolean }) {
  return (
    <Suspense fallback={<p role="status">Loading sign-in…</p>}>
      <Form signup={signup} />
    </Suspense>
  );
}
