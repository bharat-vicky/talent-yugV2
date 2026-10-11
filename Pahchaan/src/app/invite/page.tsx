"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
function Confirmation() {
  const token = useSearchParams().get("token");
  const [message,setMessage] = useState(""); const [busy,setBusy] = useState(false);
  async function accept() {
    setBusy(true);
    try {
      const response = await fetch(`/pahchaan/api/invites/${encodeURIComponent(token || "")}/accept`, { method: "POST" });
      const data = await response.json();
      if (response.ok) window.location.assign("/pahchaan/dashboard");
      else setMessage(data.error || "Invitation could not be accepted.");
    } catch { setMessage("Please try again."); } finally { setBusy(false); }
  }
  return <main className="max-w-lg mx-auto p-8 space-y-5"><h1 className="text-2xl font-bold">Join this workspace</h1><p>Sign in with the verified email address that received this invitation, then confirm below.</p><Button disabled={!token || busy} onClick={accept}>Accept invitation</Button><p role="status">{message}</p><Link href={`/login?callbackUrl=${encodeURIComponent(`/pahchaan/invite?token=${token || ""}`)}`} className="underline">Sign in</Link></main>;
}
export default function Page() { return <Suspense fallback={<p>Loading…</p>}><Confirmation /></Suspense>; }
