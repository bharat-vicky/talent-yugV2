"use client";

import { useDashboardOverview } from "../hooks/useDashboard";
import { Users, QrCode, ScanLine, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function KPIGrid({ eventId }: { eventId: string }) {
  const { data, isLoading, error } = useDashboardOverview(eventId);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm h-32 flex flex-col justify-between">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !data?.kpis) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm flex items-center justify-center text-zinc-500 h-32">
        <AlertCircle className="h-5 w-5 mr-2 text-zinc-400" />
        Failed to load KPIs
      </div>
    );
  }

  const { kpis } = data;

  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">

      {/* Capacity Card */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-zinc-300 group flex flex-col justify-between h-36">
        <div className="relative z-10 flex flex-row items-center justify-between">
          <h3 className="tracking-tight text-xs font-semibold text-zinc-500 uppercase tracking-wider">Event Capacity</h3>
          <div className="h-9 w-9 rounded-xl bg-zinc-100 border border-zinc-200/80 flex items-center justify-center text-zinc-800 transition-transform duration-300 group-hover:scale-105">
            <Users className="h-4 w-4" />
          </div>
        </div>
        <div className="relative z-10 mt-2">
          <div className="text-3xl font-bold tracking-tight text-zinc-900">{kpis.capacity?.value || "Unlimited"}</div>
          <div className="flex items-center mt-1 text-xs font-medium text-zinc-400">
            Total maximum guests
          </div>
        </div>
      </div>

      {/* Check-ins Card */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-zinc-300 group flex flex-col justify-between h-36">
        <div className="relative z-10 flex flex-row items-center justify-between">
          <h3 className="tracking-tight text-xs font-semibold text-zinc-500 uppercase tracking-wider">Checked In</h3>
          <div className="h-9 w-9 rounded-xl bg-zinc-100 border border-zinc-200/80 flex items-center justify-center text-zinc-800 transition-transform duration-300 group-hover:scale-105">
            <ScanLine className="h-4 w-4" />
          </div>
        </div>
        <div className="relative z-10 mt-2">
          <div className="text-3xl font-bold tracking-tight text-zinc-900">{kpis.checkIns.value}</div>
          <div className="flex items-center mt-1 text-xs font-medium text-zinc-400">
            Verified attendees
          </div>
        </div>
      </div>

      {/* QR Codes Card */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-zinc-300 group flex flex-col justify-between h-36">
        <div className="relative z-10 flex flex-row items-center justify-between">
          <h3 className="tracking-tight text-xs font-semibold text-zinc-500 uppercase tracking-wider">QR Scans</h3>
          <div className="h-9 w-9 rounded-xl bg-zinc-100 border border-zinc-200/80 flex items-center justify-center text-zinc-800 transition-transform duration-300 group-hover:scale-105">
            <QrCode className="h-4 w-4" />
          </div>
        </div>
        <div className="relative z-10 mt-2">
          <div className="text-3xl font-bold tracking-tight text-zinc-900">{kpis.scans.value}</div>
          <div className="flex items-center mt-1 text-xs font-medium text-zinc-400">
            Total lifetime scans
          </div>
        </div>
      </div>
    </div>
  );
}
