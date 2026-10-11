"use client";

import { useDashboardHealth } from "../hooks/useDashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export function PendingActions({ eventId }: { eventId: string }) {
  const { data, isLoading, error } = useDashboardHealth(eventId);

  if (isLoading) {
    return <Skeleton className="h-48 w-full rounded-2xl" />;
  }

  if (error || !data) {
    return (
      <div className="h-48 rounded-2xl border border-zinc-200 bg-white flex items-center justify-center text-zinc-500">
        <AlertCircle className="h-5 w-5 mr-2 text-zinc-400" />
        Failed to load tasks
      </div>
    );
  }

  const { checks } = data;
  
  const tasks = [];

  // Critical
  if (!checks.registration) {
    tasks.push({ priority: "Critical", title: "Registration Form Missing", desc: "You cannot collect guests without a form.", link: `/events/${eventId}/settings`, icon: AlertCircle, color: "text-zinc-900", bg: "bg-zinc-100" });
  }

  // Warning
  if (!checks.qr) {
    tasks.push({ priority: "Warning", title: "No QR Design", desc: "Design a QR code for check-ins.", link: `/events/${eventId}/qr`, icon: AlertTriangle, color: "text-zinc-900", bg: "bg-zinc-100" });
  }
  if (!checks.guests) {
    tasks.push({ priority: "Warning", title: "No Guests Yet", desc: "Import guests or share your link.", link: `/events/${eventId}/guests`, icon: AlertTriangle, color: "text-zinc-900", bg: "bg-zinc-100" });
  }

  // Recommended
  if (!checks.branding) {
    tasks.push({ priority: "Recommended", title: "Add Event Cover Image", desc: "Make your event look professional.", link: `/events/${eventId}/settings`, icon: Info, color: "text-zinc-900", bg: "bg-zinc-100" });
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm flex flex-col items-center justify-center text-center h-full min-h-48">
        <div className="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
          <CheckCircle2 className="h-6 w-6 text-zinc-900" />
        </div>
        <h3 className="font-semibold text-zinc-900 mb-1">Everything looks great</h3>
        <p className="text-sm text-zinc-500">Your event is fully configured and operational.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm flex flex-col">
      <div className="p-6 pb-4 border-b border-zinc-100">
        <h3 className="text-lg font-semibold tracking-tight text-zinc-900">Pending Actions</h3>
      </div>
      <div className="p-2 flex flex-col gap-1 overflow-y-auto max-h-[300px]">
        {tasks.map((task, i) => {
          const Icon = task.icon;
          return (
            <Link key={i} href={task.link} className="flex items-start gap-4 p-4 rounded-xl hover:bg-zinc-50 transition-colors">
              <div className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${task.bg}`}>
                <Icon className={`h-4 w-4 ${task.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h4 className="text-sm font-medium text-zinc-900 truncate">{task.title}</h4>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider bg-zinc-100 text-zinc-900`}>
                    {task.priority}
                  </span>
                </div>
                <p className="text-sm text-zinc-500 line-clamp-1">{task.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
