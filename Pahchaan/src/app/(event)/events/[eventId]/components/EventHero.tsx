"use client";

import { useEvent } from "@/providers/event-provider";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import { SaveAsTemplateModal } from "./SaveAsTemplateModal";

export function EventHero() {
  const { event } = useEvent();
  const router = useRouter();
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  const handlePublish = async () => {
    try {
      const res = await fetch(`/pahchaan/api/events/${event._id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: event.workspaceId, action: "publish" })
      });
      if (res.ok) {
        toast.success("Event published successfully");
        router.refresh();
      } else {
        toast.error("Failed to publish event");
      }
    } catch (e) {
      console.error(e);
      toast.error("An error occurred");
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
      <div className="flex items-center gap-6">
        {event.coverImage ? (
          <img src={event.coverImage} alt="Cover" className="w-16 h-16 rounded-xl object-cover border border-zinc-200" />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-400 font-medium text-xl">
            {event.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{event.name}</h1>
            {event.category && (
              <span className="text-xs px-2.5 py-0.5 rounded-full border border-zinc-200 bg-zinc-100 text-zinc-700 font-medium">
                {event.category}
              </span>
            )}
            <div className={`text-xs px-2.5 py-0.5 rounded-full border font-medium capitalize ${
              event.status === 'published' ? 'border-zinc-300 bg-zinc-100 text-zinc-900' : 'border-zinc-200 bg-zinc-50 text-zinc-600'
            }`}>
              {event.status}
            </div>
          </div>
          <p className="text-sm text-zinc-500">{event.description || "Manage your event operations from this command center."}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2.5">
        <NotificationBell eventId={event._id as string} />

        {event.status === "draft" && (
          <Button 
            onClick={handlePublish} 
            className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 rounded-xl h-10 px-5 font-medium shadow-sm cursor-pointer"
          >
            Publish Event
          </Button>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center justify-center h-10 w-10 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-800 transition-colors cursor-pointer shadow-sm">
            <MoreHorizontal className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl shadow-lg border-border/60">
            <DropdownMenuItem onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success("Link copied");
            }} className="cursor-pointer">Copy Event Link</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsTemplateModalOpen(true)} className="cursor-pointer">
              Save as Template
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/events/${event._id}/settings`)} className="cursor-pointer">
              Event Settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <SaveAsTemplateModal 
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        eventId={event._id as string}
        workspaceId={event.workspaceId}
        defaultName={event.name}
      />
    </div>
  );
}
