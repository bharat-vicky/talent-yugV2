"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

const workspaceSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters").regex(/^[a-z0-9-._/]+$/, "Slug can only contain lowercase letters, numbers, hyphens, underscores, dots, and slashes"),
  timezone: z.string().min(1, "Timezone is required"),
});

export default function OnboardingPage() {
  const router = useRouter();

  const getInitialStep = (): "welcome" | "workspace" => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const stepParam = params.get("step");
      if (stepParam === "workspace") return "workspace";
    }
    return "welcome";
  };

  const [step, setStep] = useState<"welcome" | "workspace">(getInitialStep);

  const workspaceForm = useForm<z.infer<typeof workspaceSchema>>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      name: "",
      slug: "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });

  const workspaceName = workspaceForm.watch("name");
  useEffect(() => {
    if (workspaceName && !workspaceForm.formState.dirtyFields.slug) {
      const slug = workspaceName.toLowerCase().replace(/[^a-z0-9-._/]+/g, '-').replace(/(^-|-$)+/g, '');
      workspaceForm.setValue("slug", slug, { shouldValidate: true });
    }
  }, [workspaceName, workspaceForm]);

  const onWorkspaceSubmit = async (values: z.infer<typeof workspaceSchema>) => {
    try {
      const res = await fetch("/pahchaan/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create workspace");

      document.cookie = `active-workspace-id=${data.data._id}; path=/; max-age=31536000`; // 1 year

      router.refresh();
      router.push("/dashboard");
    } catch (error: unknown) {
      if (error instanceof Error) {
        workspaceForm.setError("root", { message: error.message });
      }
    }
  };

  const fadeVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <div className="flex min-h-screen bg-muted/20 items-center justify-center p-4">
      <div className="w-full max-w-lg bg-background rounded-2xl border border-border/50 shadow-sm p-8 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {step === "welcome" && (
            <motion.div
              key="welcome"
              variants={fadeVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col items-center text-center gap-6"
            >
              <div className="h-16 w-16 bg-foreground rounded-xl flex items-center justify-center mb-4">
                <span className="text-background font-bold text-3xl leading-none">P</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Welcome to Pahchaan</h1>
              <p className="text-muted-foreground">
                Let&apos;s set up your enterprise event management platform. We&apos;ll start by creating your workspace.
              </p>
              <Button size="lg" className="w-full mt-4" onClick={() => setStep("workspace")}>
                Get Started
              </Button>
            </motion.div>
          )}

          {step === "workspace" && (
            <motion.div
              key="workspace"
              variants={fadeVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="mb-8">
                <h2 className="text-2xl font-bold tracking-tight">Create Workspace</h2>
                <p className="text-muted-foreground mt-1">Your workspace is where you manage your organization&apos;s events.</p>
              </div>

              <form onSubmit={workspaceForm.handleSubmit(onWorkspaceSubmit)} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="ws-name">Workspace Name</Label>
                  <Input
                    id="ws-name"
                    placeholder="Acme Corp"
                    {...workspaceForm.register("name")}
                  />
                  {workspaceForm.formState.errors.name && (
                    <span className="text-xs text-destructive">{workspaceForm.formState.errors.name.message}</span>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="ws-slug">Workspace Slug</Label>
                  <div className="flex">
                    <span className="inline-flex items-center rounded-l-md border border-r-0 border-border/50 bg-muted px-3 text-sm text-muted-foreground">
                      pahchaan /
                    </span>
                    <Input
                      id="ws-slug"
                      placeholder="acme-corp"
                      className="rounded-l-none"
                      {...workspaceForm.register("slug")}
                      onChange={(e) => {
                        const val = e.target.value.toLowerCase().replace(/[^a-z0-9-._]/g, '-');
                        workspaceForm.setValue("slug", val, { shouldValidate: true, shouldDirty: true });
                      }}
                    />
                  </div>
                  {workspaceForm.formState.errors.slug && (
                    <span className="text-xs text-destructive">{workspaceForm.formState.errors.slug.message}</span>
                  )}
                </div>

                {workspaceForm.formState.errors.root && (
                  <div className="text-sm text-destructive font-medium p-3 bg-destructive/10 rounded-md">
                    {workspaceForm.formState.errors.root.message}
                  </div>
                )}

                <Button type="submit" size="lg" className="w-full mt-4" disabled={workspaceForm.formState.isSubmitting}>
                  {workspaceForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Continue
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
