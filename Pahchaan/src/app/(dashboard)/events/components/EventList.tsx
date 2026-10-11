"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Copy, 
  Archive, 
  MapPin, 
  Calendar,
  Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Event } from "@/domain/types";
import { toast } from "sonner";
import { LoadingState } from "@/components/ui/loading-state";

interface EventListProps {
  workspaceId: string;
}

export function EventList({ workspaceId }: EventListProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['events', workspaceId, search, status, sortBy, sortOrder, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        workspaceId,
        page: page.toString(),
        limit: "9",
        sortBy,
        sortOrder
      });
      if (search) params.append("search", search);
      if (status !== "all") params.append("status", status);

      const res = await fetch(`/pahchaan/api/events?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json();
    }
  });

  const events: Event[] = data?.data?.events || [];
  const totalPages = data?.data?.totalPages || 1;

  const actionMutation = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async ({ eventId, action, payload }: { eventId: string; action: string; payload?: any }) => {
      const res = await fetch(`/pahchaan/api/events/${eventId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, action, payload })
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Action failed");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      toast.success(`Event ${variables.action}d successfully`);
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      toast.error(err.message);
    }
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
        <div className="flex flex-1 gap-2 items-center max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search events..." 
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 bg-background/50"
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={status} onValueChange={(val) => { if (val) { setStatus(val); setPage(1); } }}>
            <SelectTrigger className="w-[130px] bg-background/50">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(val) => { if (val) setSortBy(val); }}>
            <SelectTrigger className="w-[130px] bg-background/50">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="createdAt">Created</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setSortOrder(o => o === "asc" ? "desc" : "asc")}
            title={`Sort ${sortOrder === "asc" ? "Descending" : "Ascending"}`}
            className="bg-background/50"
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </Button>

          <Button onClick={() => router.push("/events/create")} className="gap-2">
            <Plus className="h-4 w-4" /> Create Event
          </Button>
        </div>
      </div>

      {/* Events Grid */}
      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <LoadingState text="Loading events..." />
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-xl bg-muted/20 min-h-[300px]">
          <Calendar className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-1">No events found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-4">
            {search || status !== "all" 
              ? "No events match your current filter criteria. Try clearing some filters."
              : "Get started by creating your first event."}
          </p>
          {(search || status !== "all") ? (
            <Button variant="outline" onClick={() => { setSearch(""); setStatus("all"); }}>Clear Filters</Button>
          ) : (
            <Button onClick={() => router.push("/events/create")}>Create Event</Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div 
                key={event._id as string} 
                className="group relative flex flex-col justify-between rounded-xl border border-border/50 bg-card p-6 shadow-sm hover:shadow-md transition-all hover:border-primary/30"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      {event.category && (
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full border border-border/60 bg-muted/60 text-foreground font-medium truncate max-w-[140px]">
                          {event.category}
                        </span>
                      )}
                      <div className="text-xs px-2.5 py-0.5 rounded-full border border-border/50 bg-background/50 capitalize font-medium text-muted-foreground">
                        {event.status}
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground -mr-2 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/events/${event._id}`)}>
                          View Dashboard
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => actionMutation.mutate({ 
                          eventId: event._id as string, 
                          action: "duplicate",
                          payload: {
                            name: `${event.name} (Copy)`,
                            slug: `${event.slug}-copy-${Math.floor(Math.random() * 10000)}`,
                            date: event.date
                          }
                        })}>
                          <Copy className="mr-2 h-4 w-4" /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => actionMutation.mutate({ eventId: event._id as string, action: event.status === "archived" ? "restore" : "archive" })}
                        >
                          <Archive className="mr-2 h-4 w-4" /> {event.status === "archived" ? "Restore" : "Archive"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <Link href={`/events/${event._id}`}>
                    <h3 className="font-semibold text-lg mb-1 truncate group-hover:underline underline-offset-4">{event.name}</h3>
                  </Link>
                  <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px] mb-4">
                    {event.description || "No description provided."}
                  </p>
                  
                  <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                    {event.category && (
                      <div className="flex items-center gap-2">
                        <Tag className="h-3.5 w-3.5" />
                        <span className="truncate">{event.category}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />
                      <span className="truncate">{new Date(event.date).toLocaleDateString(undefined, { dateStyle: "medium" })}</span>
                    </div>
                    {event.venue && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="truncate">{event.venue}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm font-medium">Page {page} of {totalPages}</span>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
