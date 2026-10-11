"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, Sparkles, Calendar, MapPin, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

const eventSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters").regex(/^[a-z0-9-._/]+$/, "Only lowercase letters, numbers, hyphens, underscores, dots, and slashes"),
  category: z.string().min(1, "Please select an event category"),
  customCategory: z.string().optional(),
  description: z.string().optional(),
  endDate: z.string().min(1, "End Date is required"),
  date: z.string().min(1, "Start Date is required"),
  venue: z.string().optional(),
  maxCapacity: z.coerce.number().min(1, "Capacity must be at least 1"),
}).refine((data) => {
  if (data.category === "Other") {
    return !!data.customCategory && data.customCategory.trim().length >= 2;
  }
  return true;
}, {
  message: "Please specify the custom category (at least 2 characters)",
  path: ["customCategory"]
});

type EventFormValues = z.infer<typeof eventSchema>;

const STEPS = [
  { id: "basic", title: "Basic Information", icon: Sparkles, desc: "Event name, slug & category" },
  { id: "datetime", title: "Date & Schedule", icon: Calendar, desc: "Start & end dates" },
  { id: "venue", title: "Venue & Capacity", icon: MapPin, desc: "Location & attendee limits" },
];

export default function CreateEventPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("templateId");
  const { data: session } = useSession();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: "",
      slug: "",
      category: "",
      customCategory: "",
      description: "",
      endDate: new Date().toISOString().split("T")[0],
      date: "",
      venue: "",
      maxCapacity: undefined,
    },
  });

  const { watch } = form;
  const values = watch();

  const sanitizeSlug = (input: string) => {
    return input
      .toLowerCase()
      .replace(/^https?:\/\//i, '')
      .replace(/^(?:www\.)?[^\/]+\//i, '')
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  const eventName = watch("name");
  useEffect(() => {
    if (eventName && !form.formState.dirtyFields.slug) {
      const slug = sanitizeSlug(eventName);
      form.setValue("slug", slug, { shouldValidate: true });
    }
  }, [eventName, form]);

  const resolveWorkspaceId = async () => {
    try {
      const res = await fetch("/pahchaan/api/workspaces/active");
      if (res.ok) {
        const json = await res.json();
        if (json?.data?.activeWorkspace?._id) {
          const wsId = json.data.activeWorkspace._id.toString();
          document.cookie = `active-workspace-id=${wsId}; path=/; max-age=31536000; SameSite=Lax`;
          return wsId;
        }
      }
    } catch {}

    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };
    let workspaceId = getCookie("active-workspace-id");
    if (!workspaceId) {
      try {
        const res = await fetch("/pahchaan/api/workspaces");
        if (res.ok) {
          const wsList = await res.json();
          if (Array.isArray(wsList) && wsList.length > 0) {
            workspaceId = wsList[0].id || wsList[0]._id;
            if (workspaceId) {
              document.cookie = `active-workspace-id=${workspaceId}; path=/; max-age=31536000; SameSite=Lax`;
            }
          }
        }
      } catch (e) {
        console.error("Failed to fetch fallback workspace:", e);
      }
    }
    return workspaceId;
  };

  const saveDraft = async (showToast = true) => {
    try {
      if (!values.name || !values.slug || !values.date || !values.endDate) {
        if (showToast) toast.error("Missing required fields (Start Date, End Date) to save draft");
        return null;
      }

      if (showToast) setIsSaving(true);
      const workspaceId = await resolveWorkspaceId();

      if (!workspaceId) return null;

      const effectiveCategory = values.category === "Other" && values.customCategory ? values.customCategory.trim() : values.category;
      const eventPayload = { ...values, category: effectiveCategory, workspaceId };

      if (!draftId) {
        const res = await fetch("/pahchaan/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventPayload)
        });
        const data = await res.json();
        if (data.success) {
          setDraftId(data.data._id);
          if (showToast) toast.success("Draft saved");
          return data.data._id;
        } else {
          if (showToast) toast.error(data.error || "Failed to save draft");
          return null;
        }
      } else {
        const res = await fetch(`/pahchaan/api/events/${draftId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventPayload)
        });
        const data = await res.json();
        if (data.success) {
          if (showToast) toast.success("Draft updated");
          return draftId;
        } else {
          if (showToast) toast.error(data.error || "Failed to update draft");
          return null;
        }
      }
    } catch (e) {
      console.error(e);
      if (showToast) toast.error("An error occurred while saving draft");
      return null;
    } finally {
      if (showToast) setIsSaving(false);
    }
  };

  const selectedCategory = watch("category");

  const nextStep = async () => {
    let fieldsToValidate: (keyof EventFormValues)[] = [];
    if (currentStep === 0) {
      fieldsToValidate = ["name", "slug", "category"];
      if (selectedCategory === "Other") {
        fieldsToValidate.push("customCategory");
      }
    } else if (currentStep === 1) {
      fieldsToValidate = ["date", "endDate"];
    } else if (currentStep === 2) {
      fieldsToValidate = ["maxCapacity"];
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (!isValid) return;

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      // Final submission
      try {
        const workspaceId = await resolveWorkspaceId();

        if (!workspaceId) {
          toast.error("Active workspace not found. Please refresh.");
          return;
        }

        const effectiveCategory = values.category === "Other" && values.customCategory ? values.customCategory.trim() : values.category;
        const finalEventPayload = {
          ...values,
          category: effectiveCategory,
          workspaceId,
          maxCapacity: Number(values.maxCapacity) || 500
        };

        if (templateId) {
          const res = await fetch(`/pahchaan/api/templates/${templateId}/action`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              workspaceId,
              action: "use",
              payload: {
                eventData: {
                  ...finalEventPayload,
                  date: new Date(values.date)
                }
              }
            })
          });
          const data = await res.json();
          if (data.success) {
            toast.success("Event created from template!");
            router.push(`/events/${data.data._id}`);
          } else {
            toast.error(data.error || "Failed to create event from template");
          }
        } else {
          const savedId = await saveDraft(false);
          const finalDraftId = savedId || draftId;

          if (!finalDraftId) {
            toast.error("Failed to save event. Please check required fields.");
            return;
          }

          const res = await fetch(`/pahchaan/api/events/${finalDraftId}/action`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ workspaceId, action: "publish" })
          });
          const data = await res.json();
          if (data.success) {
            toast.success("Event Published!");
            router.push(`/events/${finalDraftId}`);
          } else {
            toast.error(data.error || "Failed to publish event");
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-12 px-4 sm:px-6">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Create Event</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Set up your event details, registration url, schedule, and attendee capacity.
            </p>
          </div>
          {isSaving && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              <span>Saving draft...</span>
            </div>
          )}
        </div>

        {/* Multi-Step Tabs Bar */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-6">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentStep;
            const isCurrent = idx === currentStep;
            const StepIcon = step.icon;

            return (
              <div
                key={step.id}
                className={`flex items-center gap-3 p-3 sm:p-4 rounded-2xl border transition-all ${
                  isCurrent
                    ? "bg-card border-zinc-900 dark:border-white shadow-sm ring-1 ring-zinc-900/10"
                    : isCompleted
                    ? "bg-muted/40 border-border/80"
                    : "bg-transparent border-border/40 opacity-50"
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                  isCurrent
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : isCompleted
                    ? "bg-emerald-500 text-white"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
                </div>
                <div className="min-w-0 hidden sm:block">
                  <p className="text-xs font-bold text-foreground truncate">{step.title}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Spacious Form Card */}
      <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-10 shadow-sm">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {/* Step 1: Basic Information */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <div className="border-b border-border/50 pb-4">
                  <h2 className="text-lg font-bold text-foreground">Basic Information</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Define the core event details and your public registration handle.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                  {/* Event Name */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="eventName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Event Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="eventName"
                      {...form.register("name")}
                      placeholder="e.g. Global Tech Leadership Summit 2026"
                      className="h-12 rounded-xl bg-background text-sm px-4"
                    />
                    {form.formState.errors.name && (
                      <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
                    )}
                  </div>

                  {/* URL Slug */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="eventSlug" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Public Registration URL Handle <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex rounded-xl overflow-hidden border border-input focus-within:ring-1 focus-within:ring-ring focus-within:border-ring transition-all bg-background">
                      <span className="flex items-center px-4 bg-muted border-r border-input text-xs sm:text-sm text-muted-foreground font-medium whitespace-nowrap select-none">
                        pahchaan / r/
                      </span>
                      <Input
                        id="eventSlug"
                        {...form.register("slug")}
                        placeholder="summit-2026"
                        className="rounded-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none h-12 text-sm px-3"
                        onChange={(e) => {
                          const val = sanitizeSlug(e.target.value);
                          form.setValue("slug", val, { shouldValidate: true, shouldDirty: true });
                        }}
                      />
                    </div>
                    {form.formState.errors.slug && (
                      <p className="text-xs text-red-500">{form.formState.errors.slug.message}</p>
                    )}
                  </div>

                  {/* Category */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="category" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Event Category <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="category"
                      {...form.register("category")}
                      className="w-full h-12 px-4 rounded-xl border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring transition-all cursor-pointer"
                    >
                      <option value="" disabled>Select an event category...</option>
                      <option value="Technology & Innovation">Technology & Innovation</option>
                      <option value="Conference & Summit">Conference & Summit</option>
                      <option value="Corporate & Enterprise">Corporate & Enterprise</option>
                      <option value="Festival & Entertainment">Festival & Entertainment</option>
                      <option value="Networking & Social Meetup">Networking & Social Meetup</option>
                      <option value="Workshop & Training">Workshop & Training</option>
                      <option value="Exhibition & Trade Show">Exhibition & Trade Show</option>
                      <option value="Product Launch & Keynote">Product Launch & Keynote</option>
                      <option value="Charity & Gala Fundraiser">Charity & Gala Fundraiser</option>
                      <option value="Sports, Gaming & Esports">Sports, Gaming & Esports</option>
                      <option value="Education & Academic">Education & Academic</option>
                      <option value="Community & Private Gathering">Community & Private Gathering</option>
                      <option value="Other">Other</option>
                    </select>
                    {form.formState.errors.category && (
                      <p className="text-xs text-red-500">{form.formState.errors.category.message}</p>
                    )}
                  </div>

                  {/* Custom Category Input */}
                  <AnimatePresence>
                    {selectedCategory === "Other" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-1.5 sm:col-span-2 overflow-hidden"
                      >
                        <Label htmlFor="customCategory" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Specify Custom Category <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="customCategory"
                          {...form.register("customCategory")}
                          placeholder="e.g. Hackathon, Gala Dinner, Demo Day"
                          className="h-12 rounded-xl text-sm px-4 bg-background"
                        />
                        {form.formState.errors.customCategory && (
                          <p className="text-xs text-red-500">{form.formState.errors.customCategory.message}</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Description */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Description (Optional)
                    </Label>
                    <textarea
                      id="description"
                      {...form.register("description")}
                      placeholder="Brief overview of the conference agenda, keynote themes, and attendee profile..."
                      className="w-full rounded-xl border border-input bg-background p-4 text-sm shadow-xs min-h-[96px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Date & Schedule */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="border-b border-border/50 pb-4">
                  <h2 className="text-lg font-bold text-foreground">Date & Schedule</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Specify the event dates for calendar sync and countdown badges.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="startDate" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Start Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      {...form.register("date")}
                      className="h-12 rounded-xl bg-background text-sm px-4"
                    />
                    {form.formState.errors.date && (
                      <p className="text-xs text-red-500">{form.formState.errors.date.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="endDate" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      End Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      {...form.register("endDate")}
                      className="h-12 rounded-xl bg-background text-sm px-4"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Venue & Capacity */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="border-b border-border/50 pb-4">
                  <h2 className="text-lg font-bold text-foreground">Venue & Capacity</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Set physical/virtual venue details and maximum capacity threshold.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="venueLocation" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Venue Location / Address
                    </Label>
                    <Input
                      id="venueLocation"
                      {...form.register("venue")}
                      placeholder="e.g. Moscone Convention Center, San Francisco"
                      className="h-12 rounded-xl bg-background text-sm px-4"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="maxCapacity" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Maximum Attendee Capacity <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="maxCapacity"
                      type="number"
                      min="1"
                      {...form.register("maxCapacity")}
                      placeholder="e.g. 500"
                      className="h-12 rounded-xl bg-background text-sm px-4"
                    />
                    {form.formState.errors.maxCapacity && (
                      <p className="text-xs text-red-500">{form.formState.errors.maxCapacity.message}</p>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 text-xs text-muted-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>You can customize registration forms, ticket tiers, QR styling, and badges anytime from the Event Dashboard.</span>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Action Controls */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-border/60">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="h-11 px-5 rounded-xl cursor-pointer"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>

          <div className="flex items-center gap-3">
            <Button
              onClick={nextStep}
              disabled={isSaving}
              className="h-11 px-6 rounded-xl font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 cursor-pointer shadow-sm"
            >
              {currentStep === STEPS.length - 1 ? "Publish Event" : "Next Step"}
              {currentStep < STEPS.length - 1 && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
