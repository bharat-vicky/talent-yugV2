"use client";

import { use, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { StickyNote, Paperclip, Send, Clock, User as UserIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function GuestNotesPage({ params }: { params: Promise<{ eventId: string; guestId: string }> }) {
  const { eventId, guestId } = use(params);
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  const { data: guest, refetch } = useQuery({
    queryKey: ["guest", eventId, guestId],
    queryFn: async () => {
      const res = await fetch(`/pahchaan/api/events/${eventId}/guests/${guestId}`);
      const json = await res.json();
      return json.data;
    }
  });

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setIsSaving(true);
    try {
      const currentNotes = guest?.notes ? `${guest.notes}\n\n${newNote.trim()}` : newNote.trim();
      const res = await fetch(`/pahchaan/api/events/${eventId}/guests/${guestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: currentNotes })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save note");
      }
      toast.success("Note saved successfully!");
      setNewNote("");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["guest", eventId, guestId] });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save note");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <StickyNote className="w-5 h-5 text-muted-foreground" />
        <div>
          <h2 className="text-lg font-semibold">Organizer Notes</h2>
          <p className="text-sm text-muted-foreground">Private notes and logs for your team.</p>
        </div>
      </div>

      {/* Note Input */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <Textarea 
          placeholder="Add a note... (e.g. VIP handler, dietary requirements, seating arrangements)"
          className="min-h-[120px] border-0 focus-visible:ring-0 resize-none p-4 text-sm"
          value={newNote}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewNote(e.target.value)}
        />
        <div className="bg-muted/30 px-4 py-3 flex items-center justify-end border-t border-border gap-2">
          <Button size="sm" onClick={handleAddNote} disabled={isSaving || !newNote.trim()} className="rounded-xl font-semibold">
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 mr-2" />
                Save Note
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Existing Notes Feed */}
      <div className="space-y-4 pt-4">
        {guest?.notes ? (
          <div className="bg-card border border-border rounded-2xl p-5 flex gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
              <UserIcon className="w-5 h-5 text-secondary-foreground" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">Organizer / System</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Saved Note
                </span>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{guest.notes}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <StickyNote className="w-8 h-8 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No notes have been added yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
