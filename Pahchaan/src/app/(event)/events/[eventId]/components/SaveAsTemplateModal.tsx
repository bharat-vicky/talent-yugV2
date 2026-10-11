"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { LayoutTemplate, Check } from "lucide-react";
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
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { TemplateModule } from "@/domain/types";

interface SaveAsTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  workspaceId: string;
  defaultName: string;
}

const MODULES = [
  { id: "event_settings", label: "Event Settings" },
  { id: "branding", label: "Branding" },
  { id: "registration_settings", label: "Registration Settings" },
  { id: "registration_form", label: "Registration Form" },
  { id: "qr_config", label: "QR Design" },
  { id: "scanner_config", label: "Scanner Settings" },
  { id: "guest_config", label: "Guest Fields" },
  { id: "notification_config", label: "Notifications" }
] as const;

export function SaveAsTemplateModal({ isOpen, onClose, eventId, workspaceId, defaultName }: SaveAsTemplateModalProps) {
  const [name, setName] = useState(`${defaultName} Template`);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Custom");
  const [selectedModules, setSelectedModules] = useState<TemplateModule[]>(
    MODULES.map(m => m.id as TemplateModule)
  );

  const toggleModule = (moduleId: TemplateModule) => {
    setSelectedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(m => m !== moduleId)
        : [...prev, moduleId]
    );
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        modules: selectedModules,
        templateData: {
          name,
          description,
          category,
          visibility: "workspace",
        }
      };
      
      const res = await fetch(`/pahchaan/api/templates/${eventId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, action: "save-event-as-template", payload }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "Failed to save template");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Template saved successfully");
      onClose();
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5" /> Save as Template
          </DialogTitle>
          <DialogDescription>
            Create a reusable blueprint from this event&apos;s configuration.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Template Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Annual Conference Blueprint" />
          </div>
          
          <div className="space-y-2">
            <Label>Description</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of this template" />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <select 
              className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background pl-3 pr-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              <option value="Conference">Conference</option>
              <option value="Corporate">Corporate</option>
              <option value="Workshop">Workshop</option>
              <option value="Meetup">Meetup</option>
              <option value="Custom">Custom</option>
            </select>
          </div>

          <div className="space-y-3 mt-2">
            <Label>Modules to Include</Label>
            <div className="grid grid-cols-2 gap-3">
              {MODULES.map(mod => (
                <div key={mod.id} className="flex items-start space-x-2">
                  <Checkbox 
                    id={`mod-${mod.id}`} 
                    checked={selectedModules.includes(mod.id as TemplateModule)}
                    onCheckedChange={() => toggleModule(mod.id as TemplateModule)}
                  />
                  <Label htmlFor={`mod-${mod.id}`} className="text-sm font-normal cursor-pointer">
                    {mod.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !name}>
            <Check className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? "Saving..." : "Save Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
