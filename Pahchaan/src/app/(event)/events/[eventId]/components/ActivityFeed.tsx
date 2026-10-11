"use client";

import { useDashboardActivity } from "../hooks/useDashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Activity, UserPlus, FileText, CheckCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function ActivityFeed({ eventId }: { eventId: string }) {
  const { data, isLoading, error } = useDashboardActivity(eventId);

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  if (error || !data) {
    return (
      <div className="h-64 rounded-2xl border border-zinc-200 bg-white flex items-center justify-center text-zinc-500">
        <AlertCircle className="h-5 w-5 mr-2 text-zinc-400" />
        Failed to load activity
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-64 rounded-2xl border border-zinc-200 bg-white flex flex-col items-center justify-center text-center p-6">
        <Activity className="h-8 w-8 text-zinc-300 mb-3" />
        <h3 className="font-semibold text-zinc-900 mb-1">No Recent Activity</h3>
        <p className="text-sm text-zinc-500">Events will appear here as they happen.</p>
      </div>
    );
  }

  const getIcon = (action: string) => {
    if (action.includes("GUEST") || action.includes("REGISTER")) return UserPlus;
    if (action.includes("TEMPLATE")) return FileText;
    if (action.includes("CHECK")) return CheckCircle;
    return Activity;
  };

  const formatDetails = (action: string, details?: Record<string,unknown>) => {
    if (!details) return null;
    try {
      if (action === "EVENT_UPDATED" && details.updates) {
        const keys = Object.keys(details.updates).filter(k => k !== 'workspaceId');
        if (keys.length > 0) return `Updated fields: ${keys.join(", ")}`;
      }
      if (action === "EVENT_CREATED" && details.name) {
        return `Created event: ${details.name}`;
      }
      if (action === "EVENT_STATUS_CHANGED" && details.newStatus) {
        return `Changed status to ${details.newStatus}`;
      }
      if (action === "FAVORITE_ADDED") {
        return "Added to favorites";
      }
      if (action === "FAVORITE_REMOVED") {
        return "Removed from favorites";
      }
      
      const stringified = Object.entries(details)
        .filter(([k]) => k !== 'workspaceId' && k !== 'eventId' && k !== 'id')
        .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
        .join(', ');
      
      return stringified.length > 60 ? stringified.substring(0, 60) + '...' : stringified;
    } catch (e) {
      return null;
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm flex flex-col">
      <div className="p-6 pb-4 border-b border-zinc-100 flex items-center justify-between">
        <h3 className="text-lg font-semibold tracking-tight text-zinc-900">Recent Activity</h3>
      </div>
      <div className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto max-h-[400px]">
        {data.map((item: { id: string; action: string; target: string; timestamp: string; details?: Record<string,unknown> }, idx: number) => {
          const Icon = getIcon(item.action);
          const detailText = formatDetails(item.action, item.details);
          
          return (
            <div key={item.id} className="flex items-start gap-4 relative">
              {idx !== data.length - 1 && (
                <div className="absolute left-3.5 top-8 bottom-[-24px] w-px bg-zinc-100" />
              )}
              
              <div className="mt-0.5 rounded-full bg-zinc-50 border border-zinc-200 p-1.5 shrink-0 z-10">
                <Icon className="h-4 w-4 text-zinc-500" />
              </div>
              
              <div>
                <p className="text-sm text-zinc-800">
                  <span className="font-medium text-zinc-900">User</span>
                  {" "} {item.action.toLowerCase().replace(/_/g, ' ')} {" "}
                  {item.target && <span className="font-medium text-zinc-900">{item.target}</span>}
                </p>
                {detailText && (
                  <p className="text-sm text-zinc-600 mt-1 bg-zinc-50 border border-zinc-100 px-3 py-1.5 rounded-md inline-block break-all max-w-full">
                    {detailText}
                  </p>
                )}
                <p className="text-xs text-zinc-500 mt-1">
                  {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
