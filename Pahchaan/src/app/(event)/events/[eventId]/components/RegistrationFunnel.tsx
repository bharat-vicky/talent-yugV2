"use client";

import { useDashboardProgress } from "../hooks/useDashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function RegistrationFunnel({ eventId }: { eventId: string }) {
  const { data, isLoading, error } = useDashboardProgress(eventId);

  if (isLoading) {
    return <Skeleton className="h-48 w-full rounded-2xl" />;
  }

  if (error || !data) {
    return (
      <div className="h-48 rounded-2xl border border-zinc-200 bg-white flex items-center justify-center text-zinc-500">
        <AlertCircle className="h-5 w-5 mr-2 text-zinc-400" />
        Failed to load funnel
      </div>
    );
  }

  const { registration, checkIns } = data;

  if (registration.total === 0) {
    return (
      <div className="h-48 rounded-2xl border border-zinc-200 bg-white flex flex-col items-center justify-center text-center p-6">
        <h3 className="font-semibold text-zinc-900 mb-1">No Registrations Yet</h3>
        <p className="text-sm text-zinc-500 mb-4 max-w-sm">Share your registration page to start collecting attendees.</p>
        <Link href={`/events/${eventId}/settings`}>
          <Button variant="outline" className="rounded-lg h-9">Open Registration</Button>
        </Link>
      </div>
    );
  }

  // Calculate percentages for the funnel UI
  const submittedPct = 100;
  const approvedPct = registration.total > 0 ? Math.round((registration.approved / registration.total) * 100) : 0;
  const checkedInPct = registration.approved > 0 ? Math.round((checkIns.checkedIn / registration.approved) * 100) : 0;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold tracking-tight text-zinc-900 mb-6">Registration Funnel</h3>
      
      <div className="flex justify-between items-end relative h-32 px-4">
        {/* Background connector line */}
        <div className="absolute left-10 right-10 bottom-6 h-0.5 bg-zinc-100 -z-10" />

        {/* Step 1: Submitted */}
        <div className="flex flex-col items-center flex-1 z-10">
          <div className="text-sm font-medium text-zinc-600 mb-1">Submitted</div>
          <div className="text-2xl font-bold text-zinc-900 mb-3">{registration.total}</div>
          <div className="h-12 w-full max-w-16 rounded-t-md bg-zinc-100 flex items-end justify-center pb-2">
            <span className="text-xs font-semibold text-zinc-900">{submittedPct}%</span>
          </div>
        </div>

        {/* Step 2: Approved */}
        <div className="flex flex-col items-center flex-1 z-10">
          <div className="text-sm font-medium text-zinc-600 mb-1">Approved</div>
          <div className="text-2xl font-bold text-zinc-900 mb-3">{registration.approved}</div>
          <div className="h-10 w-full max-w-16 rounded-t-md bg-zinc-200 flex items-end justify-center pb-2">
            <span className="text-xs font-semibold text-zinc-900">{approvedPct}%</span>
          </div>
        </div>

        {/* Step 3: Checked In */}
        <div className="flex flex-col items-center flex-1 z-10">
          <div className="text-sm font-medium text-zinc-600 mb-1">Checked In</div>
          <div className="text-2xl font-bold text-zinc-900 mb-3">{checkIns.checkedIn}</div>
          <div className="h-8 w-full max-w-16 rounded-t-md bg-zinc-300 flex items-end justify-center pb-2">
            <span className="text-xs font-semibold text-zinc-900">{checkedInPct}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
