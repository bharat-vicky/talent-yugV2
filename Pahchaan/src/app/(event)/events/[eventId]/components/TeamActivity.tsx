"use client";

import { useDashboardTeam } from "../hooks/useDashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function TeamActivity({ eventId }: { eventId: string }) {
  const { data, isLoading, error } = useDashboardTeam(eventId);

  if (isLoading) {
    return <Skeleton className="h-48 w-full rounded-2xl" />;
  }

  if (error || !data) {
    return (
      <div className="h-48 rounded-2xl border border-zinc-200 bg-white flex items-center justify-center text-zinc-500">
        <AlertCircle className="h-5 w-5 mr-2 text-zinc-400" />
        Failed to load team
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-48 rounded-2xl border border-zinc-200 bg-white flex flex-col items-center justify-center text-center p-6">
        <Users className="h-8 w-8 text-zinc-300 mb-3" />
        <h3 className="font-semibold text-zinc-900 mb-1">No Team Members</h3>
        <p className="text-sm text-zinc-500 mb-4">Invite teammates to collaborate.</p>
        <Link href={`/workspace/settings/team`}>
          <Button variant="outline" className="rounded-lg h-9">Manage Team</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm flex flex-col">
      <div className="p-6 pb-4 border-b border-zinc-100 flex items-center justify-between">
        <h3 className="text-lg font-semibold tracking-tight text-zinc-900">Workspace Members</h3>
      </div>
      <div className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[300px]">
        {data.map((member: { userId: string; name: string; email: string; role: string }) => (
          <div key={member.userId} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 border border-zinc-200">
                <AvatarFallback className="bg-zinc-100 text-zinc-600 text-xs font-medium">
                  {member.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-zinc-900">{member.name}</p>
                <p className="text-xs text-zinc-500">{member.email}</p>
              </div>
            </div>
            <div className="text-xs font-medium px-2 py-1 rounded-md bg-zinc-100 text-zinc-600 capitalize">
              {member.role}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
