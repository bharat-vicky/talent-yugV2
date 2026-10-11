"use client";

import { useEvent } from "@/providers/event-provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STANDARD_CATEGORIES = [
  "Technology & Innovation",
  "Conference & Summit",
  "Corporate & Enterprise",
  "Festival & Entertainment",
  "Networking & Social Meetup",
  "Workshop & Training",
  "Exhibition & Trade Show",
  "Product Launch & Keynote",
  "Charity & Gala Fundraiser",
  "Sports, Gaming & Esports",
  "Education & Academic",
  "Community & Private Gathering",
  "Other"
];

export default function EventSettingsPage() {
  const { event } = useEvent();
  const router = useRouter();
  
  const initialCategory = event.category || "";
  const isPredefined = STANDARD_CATEGORIES.slice(0, -1).includes(initialCategory);

  const [name, setName] = useState(event.name || "");
  const [slug, setSlug] = useState(event.slug || "");
  const [category, setCategory] = useState(isPredefined ? initialCategory : initialCategory ? "Other" : "");
  const [customCategory, setCustomCategory] = useState(isPredefined ? "" : initialCategory);
  const [date, setDate] = useState(event.date ? new Date(event.date).toISOString().split('T')[0] : "");
  const [endDate, setEndDate] = useState(event.endDate ? new Date(event.endDate).toISOString().split('T')[0] : "");
  const [venue, setVenue] = useState(event.venue || "");
  const [description, setDescription] = useState(event.description || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const saveGeneral = async () => {
    const finalCategory = category === "Other" ? customCategory.trim() : category;

    if (!finalCategory) {
      toast.error("Please select or specify a category");
      return;
    }
    if (category === "Other" && finalCategory.length < 2) {
      toast.error("Please specify a custom category (at least 2 characters)");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/pahchaan/api/events/${event._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          workspaceId: event.workspaceId, 
          name, 
          slug, 
          category: finalCategory, 
          date: date ? new Date(date) : undefined, 
          endDate: endDate ? new Date(endDate) : undefined, 
          venue, 
          description 
        })
      });
      if (res.ok) {
        toast.success("Settings saved successfully!");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to save settings");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const archiveEvent = async () => {
    setIsArchiving(true);
    try {
      const res = await fetch(`/pahchaan/api/events/${event._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: event.workspaceId, status: "archived" })
      });
      if (!res.ok) throw new Error("Failed to archive");
      toast.success("Event archived");
      router.push("/events");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setIsArchiving(false);
    }
  };

  const deleteEvent = async () => {
    if (!confirm("Are you sure you want to permanently delete this event?")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/pahchaan/api/events/${event._id}?workspaceId=${event.workspaceId}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Event deleted");
      router.push("/events");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full p-6 md:p-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Event Settings</h1>
        <p className="text-muted-foreground">Manage configuration for {event.name}.</p>
      </div>

      <Tabs defaultValue="general" className="w-full flex flex-col gap-6">
        <TabsList className="w-full justify-start h-14 p-1.5 bg-card/50 border border-border/50 rounded-xl overflow-x-auto flex-nowrap backdrop-blur-xl shadow-sm">
          <TabsTrigger value="general" className="rounded-lg px-6 py-2.5 text-sm font-medium">General</TabsTrigger>
          <TabsTrigger value="danger" className="rounded-lg px-6 py-2.5 text-sm font-medium text-muted-foreground hover:text-red-600 data-[state=active]:text-red-600 data-[state=active]:bg-red-500/10">Danger Zone</TabsTrigger>
        </TabsList>

        <div className="flex-1 bg-card border border-border/50 rounded-2xl p-8 shadow-sm">
          <TabsContent value="general" className="mt-0 flex flex-col gap-8">
            <div className="flex flex-col gap-2 border-b border-border pb-6">
              <h2 className="text-2xl font-semibold tracking-tight">General Information</h2>
              <p className="text-muted-foreground">Update the basic details and visibility of your event.</p>
            </div>
            
            <div className="flex flex-col gap-3">
              <Label htmlFor="name" className="text-sm font-semibold text-foreground/80">Event Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="h-12 text-lg px-4 bg-muted/30 border-border/50 rounded-xl focus-visible:ring-primary/20 focus-visible:border-primary transition-all" />
            </div>

            <div className="flex flex-col gap-3">
              <Label htmlFor="slug" className="text-sm font-semibold text-foreground/80">Event Slug</Label>
              <div className="flex">
                <span className="inline-flex items-center rounded-l-xl border border-r-0 border-border/50 bg-muted/30 px-4 text-sm text-muted-foreground h-12">
                  pahchaan / r/
                </span>
                <Input 
                  id="slug" 
                  value={slug} 
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-._/]/g, '-'))} 
                  className="h-12 text-lg px-4 bg-muted/30 border-border/50 rounded-l-none rounded-r-xl focus-visible:ring-primary/20 focus-visible:border-primary transition-all" 
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Label htmlFor="category" className="text-sm font-semibold text-foreground/80">
                Category <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-border/50 bg-muted/30 text-base appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all pr-10"
                >
                  <option value="" disabled>Select an event category...</option>
                  {STANDARD_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <AnimatePresence>
              {category === "Other" && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-3 overflow-hidden"
                >
                  <Label htmlFor="customCategory" className="text-sm font-semibold text-foreground/80">
                    Specify Category <span className="text-destructive">*</span>
                  </Label>
                  <Input 
                    id="customCategory" 
                    value={customCategory} 
                    onChange={(e) => setCustomCategory(e.target.value)} 
                    placeholder="e.g. Hackathon, Art Exhibition, etc." 
                    className="h-12 text-base px-4 bg-muted/30 border-border/50 rounded-xl focus-visible:ring-primary/20 focus-visible:border-primary transition-all" 
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-3">
                <Label htmlFor="date" className="text-sm font-semibold text-foreground/80">Start Date</Label>
                <Input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-12 px-4 bg-muted/30 border-border/50 rounded-xl focus-visible:ring-primary/20 focus-visible:border-primary transition-all" />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="endDate" className="text-sm font-semibold text-foreground/80">End Date</Label>
                <Input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-12 px-4 bg-muted/30 border-border/50 rounded-xl focus-visible:ring-primary/20 focus-visible:border-primary transition-all" />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Label htmlFor="venue" className="text-sm font-semibold text-foreground/80">Venue Location</Label>
              <Input id="venue" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g. Moscone Center, San Francisco" className="h-12 px-4 bg-muted/30 border-border/50 rounded-xl focus-visible:ring-primary/20 focus-visible:border-primary transition-all" />
            </div>

            <div className="flex flex-col gap-3">
              <Label htmlFor="desc" className="text-sm font-semibold text-foreground/80">Description</Label>
              <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[120px] text-base p-4 bg-muted/30 border-border/50 rounded-xl focus-visible:ring-primary/20 focus-visible:border-primary transition-all resize-y" />
            </div>

            <div className="pt-4 flex justify-end">
              <Button 
                onClick={saveGeneral} 
                disabled={isSaving}
                size="lg" 
                className="bg-primary text-primary-foreground font-semibold px-8 hover:scale-105 transition-transform"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="danger" className="mt-0 flex flex-col gap-6">
            <div className="flex flex-col gap-2 border-b border-border pb-4">
              <h2 className="text-xl font-semibold tracking-tight">Danger Zone</h2>
              <p className="text-sm text-muted-foreground">Irreversible actions that affect your entire event and its data.</p>
            </div>
            
            <div className="flex flex-col border border-destructive/30 rounded-lg overflow-hidden">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-5 bg-background hover:bg-muted/30 transition-colors">
                <div className="space-y-1 pr-4">
                  <h4 className="text-sm font-semibold">Archive Event</h4>
                  <p className="text-sm text-muted-foreground">Archived events become read-only and disappear from active lists. Data is preserved.</p>
                </div>
                <Button variant="outline" className="text-destructive border-destructive/50 hover:bg-destructive hover:text-destructive-foreground whitespace-nowrap font-medium min-w-[140px]" onClick={archiveEvent} disabled={isArchiving || event.status === "archived"}>
                  {isArchiving ? "Archiving..." : event.status === "archived" ? "Archived" : "Archive Event"}
                </Button>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-5 border-t border-destructive/30 bg-background hover:bg-destructive/5 transition-colors">
                <div className="space-y-1 pr-4">
                  <h4 className="text-sm font-semibold text-destructive">Delete Event</h4>
                  <p className="text-sm text-muted-foreground">Permanently delete this event and all associated guests, QR codes, and analytics. This cannot be undone.</p>
                </div>
                <Button variant="destructive" className="whitespace-nowrap font-medium min-w-[140px]" onClick={deleteEvent} disabled={isDeleting}>
                  {isDeleting ? "Deleting..." : "Delete Event"}
                </Button>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
