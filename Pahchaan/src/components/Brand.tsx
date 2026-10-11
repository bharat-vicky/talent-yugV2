import { cn } from "@/lib/utils";
export function BrandMark({ className }: { className?: string }) {
  return <svg viewBox="0 0 40 40" fill="none" aria-hidden="true" className={cn("size-9 shrink-0", className)}>
    <rect width="40" height="40" rx="12" fill="currentColor" />
    <path d="M10 17v-7h7M23 10h7v7M30 23v7h-7M17 30h-7v-7" stroke="var(--brand-mark-ink, #fcfcf7)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="16" y="16" width="8" height="8" rx="2" fill="#fa956a" />
  </svg>;
}
export function Brand({ className, compact = false }: { className?: string; compact?: boolean }) {
  return <span className={cn("inline-flex items-center gap-2.5 text-primary", className)}><BrandMark />{!compact && <span className="text-[1.35rem] font-bold tracking-[-0.06em] leading-none">Pahchaan<span className="text-[#d6764c]">.</span></span>}</span>;
}
