/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { appUrl } from "@/lib/brand";

import { use, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GuestTimeline } from "@/components/guests/Timeline";
import { QRCodeSVG } from "qrcode.react";
import {
  Phone,
  Briefcase,
  Building2,
  CheckSquare,
  StickyNote,
  Loader2,
  Check,
  Edit3,
  Mail,
  User as UserIcon,
  Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function GuestOverviewPage({ params }: { params: Promise<{ eventId: string; guestId: string }> }) {
  const { eventId, guestId } = use(params);
  const queryClient = useQueryClient();

  const { data: guest } = useQuery({
    queryKey: ["guest", eventId, guestId],
    queryFn: async () => {
      const res = await fetch(`/pahchaan/api/events/${eventId}/guests/${guestId}`);
      const json = await res.json();
      return json.data;
    }
  });

  const [notesDraft, setNotes] = useState<string | null>(null);
  const notes = notesDraft ?? guest?.notes ?? "";
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editDraft,setEditForm]=useState<Partial<Record<"firstName"|"lastName"|"email"|"phone"|"title"|"organization",string>>>({});
  const editForm={...{firstName:guest?.firstName||"",lastName:guest?.lastName||"",email:guest?.email||"",phone:guest?.phone||"",title:guest?.title||"",organization:guest?.organization||""},...editDraft};

  const handleSaveNote = async () => {
    setIsSavingNote(true);
    try {
      const res = await fetch(`/pahchaan/api/events/${eventId}/guests/${guestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save note");
      }
      setIsSaved(true);
      toast.success("Note saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["guest", eventId, guestId] });
      setTimeout(() => setIsSaved(false), 2000);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save note");
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingEdit(true);
    try {
      const res = await fetch(`/pahchaan/api/events/${eventId}/guests/${guestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm)
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update guest details");
      }
      toast.success("Guest details updated successfully!");
      setIsEditModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["guest", eventId, guestId] });
      queryClient.invalidateQueries({ queryKey: ["guests", eventId] });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update guest details");
    } finally {
      setIsSavingEdit(false);
    }
  };

  if (!guest) return null;

  // Resolve fields with fallbacks if customData exists
  const resolvedPhone = guest.phone || (guest.customData && Object.entries(guest.customData).find(([k]) => k.toLowerCase().includes('phone') || k.toLowerCase().includes('mobile') || k.toLowerCase().includes('contact'))?.[1] as string) || "";

  const resolvedTitle = guest.title || guest.role || guest.designation || guest.jobTitle || (guest.customData && Object.entries(guest.customData).find(([k]) => k.toLowerCase().includes('role') || k.toLowerCase().includes('title') || k.toLowerCase().includes('job') || k.toLowerCase().includes('position') || k.toLowerCase().includes('designation'))?.[1] as string) || "";

  const resolvedOrg = guest.organization || guest.company || (guest.customData && Object.entries(guest.customData).find(([k]) => k.toLowerCase().includes('company') || k.toLowerCase().includes('org') || k.toLowerCase().includes('business') || k.toLowerCase().includes('employer'))?.[1] as string) || "";

  // Build timeline events from guest data
  const checkInEvents = (guest.checkIns || []).map((ci: any) => ({
    type: ci.direction === "in" ? "checked_in" : "checked_out",
    title: ci.direction === "in" ? "Checked In" : "Checked Out",
    description: ci.location ? `Location: ${ci.location}` : undefined,
    createdAt: ci.timestamp
  }));

  const timelineEvents = [
    { type: "created", title: "Guest Created", createdAt: guest.createdAt },
    guest.status === "approved" ? { type: "registration_approved", title: "Registration Approved", createdAt: guest.updatedAt } : null,
    guest.qrCodeId ? { type: "qr_generated", title: "Badge QR Generated", createdAt: guest.updatedAt } : null,
    ...checkInEvents
  ].filter(Boolean) as any[];

  return (
    <div className="max-w-6xl mx-auto p-8 grid grid-cols-1 md:grid-cols-3 gap-8">

      <div className="md:col-span-2 space-y-6">
        <div className="bg-card border border-border/40 rounded-3xl p-8 shadow-2xl shadow-black/[0.02]">
          <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-8">Activity Timeline</h3>
          <GuestTimeline events={timelineEvents} />
        </div>

        {/* Internal Notes Card */}
        <div className="bg-card border border-border/40 rounded-3xl p-8 shadow-2xl shadow-black/[0.02] relative overflow-hidden group">
          <div className="flex items-center gap-2 mb-6">
            <StickyNote className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Internal Notes</h3>
          </div>

          <textarea
            className="w-full bg-muted/20 border border-border/50 rounded-2xl p-5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/60"
            placeholder="Add internal notes about this guest... (e.g. VIP handler, dietary requirements)"
            rows={5}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex justify-end mt-4">
            <Button
              size="sm"
              variant="secondary"
              className="rounded-xl font-semibold shadow-sm px-5"
              onClick={handleSaveNote}
              disabled={isSavingNote}
            >
              {isSavingNote ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : isSaved ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-2 text-emerald-500" />
                  Saved
                </>
              ) : (
                "Save Note"
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Quick QR View */}
        <div className="bg-card border border-border/40 rounded-3xl p-8 shadow-2xl shadow-black/[0.02] flex flex-col items-center justify-center text-center relative overflow-hidden group">
          {/* Ambient Glow */}
          <div className={`absolute top-0 right-0 w-48 h-48 blur-[50px] rounded-full pointer-events-none transition-colors duration-500 ${guest.qrCodeId ? 'bg-emerald-500/10' : 'bg-yellow-500/10'}`} />

          <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-6 relative z-10">Assigned QR</h3>

          <div className="bg-white p-4 rounded-2xl border shadow-sm mb-6 relative z-10 group-hover:scale-105 transition-transform duration-300">
            <QRCodeSVG
              value={guest.qrCodeId ? appUrl(`/q/${guest.qrCodeId}`) : JSON.stringify({ g: guestId })}
              size={150}
              level="H"
            />
          </div>

          {guest.qrCodeId ? (
            <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 px-4 py-2 rounded-full text-xs font-bold tracking-wide relative z-10 border border-emerald-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Dynamic QR Active
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-yellow-500/10 text-yellow-600 px-4 py-2 rounded-full text-xs font-bold tracking-wide relative z-10 border border-yellow-500/20">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              Pending Sync
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="bg-card border border-border/40 rounded-3xl p-8 shadow-2xl shadow-black/[0.02]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Guest Details</h3>

            <Button variant="ghost" size="sm" onClick={() => setIsEditModalOpen(true)} className="h-8 px-2 text-xs font-medium text-muted-foreground hover:text-foreground">
              <Edit3 className="w-3.5 h-3.5 mr-1.5" /> Edit
            </Button>

            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
              <DialogContent className="sm:max-w-2xl p-6 sm:p-8 rounded-3xl">
                <DialogHeader className="space-y-1">
                  <DialogTitle className="text-xl font-bold">Edit Guest Details</DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    Update personal information, contact phone, designation, and organization.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSaveDetails} className="space-y-5 py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-fn" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">First Name *</Label>
                      <Input
                        id="edit-fn"
                        required
                        className="h-11 rounded-xl bg-background"
                        value={editForm.firstName}
                        onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-ln" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last Name</Label>
                      <Input
                        id="edit-ln"
                        className="h-11 rounded-xl bg-background"
                        value={editForm.lastName}
                        onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email Address *</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        required
                        className="h-11 rounded-xl bg-background"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-phone" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone Number</Label>
                      <Input
                        id="edit-phone"
                        className="h-11 rounded-xl bg-background"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Role / Title</Label>
                      <Input
                        id="edit-title"
                        className="h-11 rounded-xl bg-background"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        placeholder="e.g. Senior Software Engineer"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="edit-org" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Company / Organization</Label>
                      <Input
                        id="edit-org"
                        className="h-11 rounded-xl bg-background"
                        value={editForm.organization}
                        onChange={(e) => setEditForm({ ...editForm, organization: e.target.value })}
                        placeholder="e.g. Acme Corp"
                      />
                    </div>
                  </div>

                  <DialogFooter className="pt-4 gap-2">
                    <Button type="button" variant="outline" className="h-11 px-5 rounded-xl cursor-pointer" onClick={() => setIsEditModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="h-11 px-6 rounded-xl font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 cursor-pointer shadow-sm" disabled={isSavingEdit}>
                      {isSavingEdit ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Saving...
                        </>
                      ) : (
                        "Save Details"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-5 text-sm">
            <div className="flex justify-between items-center pb-4 border-b border-border/40">
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="bg-muted p-1.5 rounded-lg">
                  <Phone className="w-4 h-4" />
                </div>
                <span className="font-medium">Phone</span>
              </div>
              <span className="font-bold text-foreground text-right">{resolvedPhone || "—"}</span>
            </div>

            <div className="flex justify-between items-center pb-4 border-b border-border/40">
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="bg-muted p-1.5 rounded-lg">
                  <Briefcase className="w-4 h-4" />
                </div>
                <span className="font-medium">Role/Title</span>
              </div>
              <span className="font-bold text-foreground text-right">{resolvedTitle || "—"}</span>
            </div>

            <div className="flex justify-between items-center pb-4 border-b border-border/40">
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="bg-muted p-1.5 rounded-lg">
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="font-medium">Company</span>
              </div>
              <span className="font-bold text-foreground text-right">{resolvedOrg || "—"}</span>
            </div>

            <div className="flex justify-between items-center pt-2">
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="bg-primary/10 text-primary p-1.5 rounded-lg">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <span className="font-medium">Total Check-ins</span>
              </div>
              <span className="text-lg font-black text-primary text-right">{guest.checkIns?.length || 0}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
