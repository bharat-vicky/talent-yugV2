import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-6 max-w-4xl mx-auto flex flex-col gap-8">
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div className="flex items-center gap-3">
          <Link href="/signup">
            <Button variant="ghost" size="sm" className="rounded-xl font-medium text-xs">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Sign Up
            </Button>
          </Link>
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pahchaan</span>
      </div>

      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-black tracking-tight">Terms of Service</h1>
        <p className="text-sm text-muted-foreground">Last updated: August 2026</p>
      </div>

      <div className="flex flex-col gap-6 text-sm text-foreground/90 leading-relaxed border-t border-border/60 pt-6">
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-bold text-foreground">1. Acceptance of Terms</h2>
          <p>By accessing or using the Pahchaan Event Management Platform (&quot;Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.</p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-bold text-foreground">2. Description of Service</h2>
          <p>Pahchaan provides event organizers, enterprise admins, and attendees with tools for event management, QR code identification, registration form customization, guest check-in, and analytics.</p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-bold text-foreground">3. User Accounts & Responsibilities</h2>
          <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use.</p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-bold text-foreground">4. Privacy & Data Protection</h2>
          <p>Your privacy is important to us. Please review our <Link href="/privacy" className="text-zinc-900 dark:text-zinc-100 font-bold underline">Privacy Policy</Link> to understand how we collect, use, and protect your information.</p>
        </section>
      </div>
    </div>
  );
}
