"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updateWorkspace } from "../actions";

interface GeneralSettingsFormProps {
  workspace: {
    _id?: string;
    name: string;
    slug: string;
  };
}

export function GeneralSettingsForm({ workspace }: GeneralSettingsFormProps) {
  const [name, setName] = useState(workspace.name);
  const [slug, setSlug] = useState(workspace.slug);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      toast.error("Name and slug are required");
      return;
    }

    setIsLoading(true);
    const result = await updateWorkspace(workspace._id as string, { name, slug });
    setIsLoading(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Workspace settings saved");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-6 rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-md">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">General Information</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage the profile of your workspace.</p>
      </div>

      <div className="grid gap-5">
        <div className="grid gap-2">
          <Label htmlFor="name" className="text-sm font-medium text-foreground">Workspace Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="max-w-md h-10 border-zinc-200 focus-visible:ring-1 focus-visible:ring-zinc-900 focus-visible:border-zinc-900 rounded-lg"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="slug" className="text-sm font-medium text-foreground">Workspace Slug</Label>
          <div className="flex max-w-md rounded-lg overflow-hidden border border-zinc-200 focus-within:ring-1 focus-within:ring-zinc-900 focus-within:border-zinc-900 transition-all">
            <span className="flex items-center px-3 bg-zinc-50 border-r border-zinc-200 text-sm text-zinc-500 font-medium whitespace-nowrap">
              pahchaan /
            </span>
            <input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-._]/g, '-'))}
              className="flex-1 px-3 h-10 text-sm outline-none bg-transparent"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-5 mt-2 border-t border-zinc-100">
        <Button type="submit" disabled={isLoading} className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg px-6 h-10">
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
