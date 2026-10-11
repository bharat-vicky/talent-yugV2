import Link from "next/link";
import { ArrowUpRight, Check, ScanLine, Users, CalendarDays } from "lucide-react";
import { Brand } from "@/components/Brand";
import type { Metadata } from "next";

export const metadata: Metadata = { robots: { index: false, follow: false }, referrer: "no-referrer" };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="pahchaan-auth min-h-screen grid md:grid-cols-2 bg-background">
    <aside className="hidden md:flex flex-col justify-between relative overflow-hidden bg-primary text-primary-foreground p-10 lg:p-16">
      <Link href="/" aria-label="Pahchaan home"><Brand className="text-[#fcfcf7] [--brand-mark-ink:#184b3f]" /></Link>
      <div className="relative z-10 py-16 max-w-lg">
        <p className="text-xs tracking-[0.18em] uppercase text-[#dbe5cb] mb-6">A little less planning. A lot more connection.</p>
        <h2 className="text-5xl lg:text-6xl tracking-tight leading-[1.08]">Good events begin<br />with a <em className="font-heading font-normal text-[#fbb58d]">warm welcome.</em></h2>
        <p className="mt-7 text-[#dce5dc] leading-relaxed max-w-sm">From the first invitation to the last check-in. One thoughtful space for your events, your team, and every guest.</p>
        <div className="mt-10 rounded-2xl border border-white/20 bg-white/5 p-6 max-w-sm">
          <div className="flex justify-between text-xs uppercase tracking-widest text-[#cbd9bd]"><span>The welcome, made simple</span><ArrowUpRight size={17} /></div>
          <div className="flex items-center gap-4 mt-5"><div className="rounded-xl bg-[#e9edcf] p-3 text-primary"><ScanLine size={28} /></div><div><p className="font-semibold">A pass. A scan. You&apos;re in.</p><p className="text-sm text-[#dce5dc] mt-1">More time for the moments that matter.</p></div></div>
          <div className="mt-6 flex gap-3 text-xs text-[#dce5dc]"><span className="inline-flex gap-1.5 items-center"><CalendarDays size={14} /> Events</span><span className="inline-flex gap-1.5 items-center"><Users size={14} /> Guests</span><span className="inline-flex gap-1.5 items-center"><Check size={14} /> Check-ins</span></div>
        </div>
      </div>
      <p className="text-xs text-[#cbd9bd]">Made for the people bringing people together.</p>
      <div aria-hidden="true" className="absolute size-80 rounded-full border border-white/10 -right-48 top-32" />
    </aside>
    <div className="flex flex-col p-6 sm:p-10 lg:p-16 min-w-0">
      <div className="flex justify-between items-center mb-10"><Link href="/" className="md:hidden" aria-label="Pahchaan home"><Brand /></Link><Link href="/" className="ml-auto text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-2">Back to home <ArrowUpRight size={15} /></Link></div>
      <div className="flex flex-1 items-center justify-center py-8"><div className="w-full max-w-sm">{children}</div></div>
      <p className="text-center text-xs text-muted-foreground mt-8">Your next gathering starts here.</p>
    </div>
  </div>;
}
