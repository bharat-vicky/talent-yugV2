import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-black tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: August 2026</p>
      </div>

      <div className="flex flex-col gap-6 text-sm text-foreground/90 leading-relaxed border-t border-border/60 pt-6">
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-bold text-foreground">1. Information We Collect</h2>
          <p>Pahchaan collects information you provide directly to us when creating an account, registering for events, customizing registration forms, or interacting with attendee QR identification scanners.</p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-bold text-foreground">2. How We Use Information</h2>
          <p>We use collected information to provide, maintain, and improve the Pahchaan platform, facilitate event guest check-ins, process registrations, and provide real-time event analytics.</p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-bold text-foreground">3. Data Security & Storage</h2>
          <p>We implement enterprise-grade security measures to safeguard your personal data against unauthorized access, disclosure, alteration, or destruction.</p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-bold text-foreground">4. Contact Us</h2>
          <p>If you have any questions regarding this Privacy Policy, please contact your workspace organizer for the appropriate privacy contact.</p>
        </section>
      </div>
    </div>
  );
}
