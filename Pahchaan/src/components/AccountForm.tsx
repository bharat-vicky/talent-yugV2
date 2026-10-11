"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

function Form({ mode }: { mode: "verify" | "forgot" | "reset" }) {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);
  const [visible, setVisible] = useState(false);
  const [linkResult, setLinkResult] = useState<{
    request: string;
    state: "valid" | "invalid" | "unavailable";
  } | null>(null);
  const [retry, setRetry] = useState(0);
  const token = params.get("token");
  const linkRequest = `${mode}:${token}:${retry}`;
  const linkState = !token || !/^[a-f0-9]{64}$/.test(token)
    ? "invalid"
    : linkResult?.request === linkRequest ? linkResult.state : "checking";
  const action = mode === "verify" && !token ? "resend" : mode;
  const needsPassword = mode !== "forgot" && !!token;
  const canSubmit = !needsPassword || linkState === "valid";
  useEffect(() => {
    if (mode === "forgot" || !token) return;
    const controller = new AbortController();
    if (!/^[a-f0-9]{64}$/.test(token)) {
      return () => controller.abort();
    }
    fetch("/pahchaan/api/account/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, purpose: mode }),
      signal: controller.signal,
    })
      .then((response) => {
        if (!controller.signal.aborted)
          setLinkResult({
            request: linkRequest,
            state: response.ok
              ? "valid"
              : response.status === 400
                ? "invalid"
                : "unavailable",
          });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setLinkResult({ request: linkRequest, state: "unavailable" });
      });
    return () => controller.abort();
  }, [mode, token, linkRequest]);
  const title =
    mode === "verify"
      ? "Verify your email"
      : mode === "forgot"
        ? "Recover your account"
        : "Choose a new password";
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || complete || !canSubmit) return;
    if (needsPassword && new TextEncoder().encode(password).length > 72) {
      setMessage("Password is too long. Use at most 72 bytes.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/pahchaan/api/account/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, token }),
      });
      const data = await response.json();
      setMessage(data.message || data.error || "Please try again.");
      if (response.ok && (action === "reset" || action === "verify")) {
        setComplete(true);
        setPassword("");
      } else if (
        response.status === 400 &&
        needsPassword &&
        /link|email to continue/i.test(data.error || "")
      )
        setLinkResult({ request: linkRequest, state: "invalid" });
    } catch {
      setMessage("Could not connect. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-5"
      aria-busy={busy || (needsPassword && linkState === "checking")}
    >
      <h1 className="text-2xl font-bold">{title}</h1>
      {(mode === "forgot" || action === "resend") && (
        <>
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={254}
            required
            disabled={busy}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </>
      )}
      {needsPassword && linkState === "checking" && (
        <p role="status">Checking your link…</p>
      )}
      {needsPassword && linkState === "invalid" && (
        <p role="alert" className="text-sm">
          This link has expired, has already been used, or is invalid.{" "}
          <Link
            href={mode === "verify" ? "/verify-email" : "/forgot-password"}
            className="underline"
          >
            Request a new email
          </Link>
          .
        </p>
      )}
      {needsPassword && linkState === "unavailable" && (
        <div className="space-y-3 text-sm" role="alert">
          <p>We couldn’t check your link. Please try again shortly.</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => setRetry((value) => value + 1)}
          >
            Try again
          </Button>
        </div>
      )}
      {needsPassword && linkState === "valid" && !complete && (
        <>
          <Label htmlFor="password">Choose your password</Label>
          <div className="relative">
            <Input
              id="password"
              type={visible ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={12}
              disabled={busy}
              aria-describedby="account-password-help"
              className="pr-12"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setVisible((value) => !value)}
              aria-label={visible ? "Hide password" : "Show password"}
              aria-pressed={visible}
              className="absolute right-1 top-0 flex h-full w-10 items-center justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-primary"
            >
              {visible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p id="account-password-help" className="text-sm">
            Use at least 12 characters. This becomes your sign-in password after
            confirming ownership of your email.
          </p>
        </>
      )}
      {mode === "reset" && !token && (
        <p role="alert" className="text-sm">
          A recovery link is required.{" "}
          <Link href="/forgot-password" className="underline">
            Request a new link
          </Link>
          .
        </p>
      )}
      {!complete && canSubmit && !(mode === "reset" && !token) && (
        <Button type="submit" disabled={busy || (mode === "reset" && !token)}>
          {busy
            ? "Please wait…"
            : action === "resend"
              ? "Send verification email"
              : mode === "verify"
                ? "Verify email & create account"
                : mode === "forgot"
                  ? "Send recovery email"
                  : "Change password"}
        </Button>
      )}
      <p role="status" className="text-sm">
        {message}
      </p>
      <Link href="/login" className="underline">
        Back to sign in
      </Link>
    </form>
  );
}
export default function AccountForm({
  mode,
}: {
  mode: "verify" | "forgot" | "reset";
}) {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <Form mode={mode} />
    </Suspense>
  );
}
