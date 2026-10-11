"use client";
import { appUrl } from "@/lib/brand";

import { use, useEffect, useRef, useState } from "react";
import { useEvent } from "@/providers/event-provider";
import type QRCodeStylingType from "qr-code-styling";
import { QRTemplate, QRCodeDesignOptions } from "@/domain/types";
import { Button } from "@/components/ui/button";
import { Save, Layout, Undo2, Redo2, RotateCcw, Sparkles, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { QRExportService } from "@/application/services/QRExportService";

// Custom Hooks & Components
import { useHistory } from "@/hooks/use-history";
import { QR_PRESETS } from "./presets";
import { PresetsToolbar } from "./components/PresetsToolbar";
import { ConfiguratorSidebar } from "./components/ConfiguratorSidebar";
import { PreviewPanel } from "./components/PreviewPanel";

const defaultDesign: QRCodeDesignOptions = QR_PRESETS.Default;

export default function QRDesignStudio({ params }: { params: Promise<{ qrId: string }> }) {
  const { qrId } = use(params);
  const { event } = useEvent();
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("templateId");
  
  const qrRef = useRef<QRCodeStylingType | null>(null);
  const isNew = qrId === "new";

  // Name and Destination
  const { state: name, set: setName, replace: replaceName } = useHistory(isNew ? "Untitled QR Code" : "Loading...");
  const { state: destination, set: setDestination, replace: replaceDestination } = useHistory(appUrl());
  
  // Save Template States
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDesc, setTemplateDesc] = useState("");
  
  const [generationMode, setGenerationMode] = useState<"single" | "bulk">("single");
  const [bulkOptions, setBulkOptions] = useState({ quantity: 10, prefix: "QR-", startNumber: 1, padding: 4 });
  
  // Design Options (using history)
  const { 
    state: design, 
    set: setDesign, 
    replace: replaceDesign, 
    undo, 
    redo, 
    reset,
    canUndo, 
    canRedo 
  } = useHistory<QRCodeDesignOptions>(defaultDesign);

  const { data: existingQR, isLoading } = useQuery({
    queryKey: ["qr", event._id, qrId],
    queryFn: async () => {
      if (isNew) return null;
      const res = await fetch(`/pahchaan/api/events/${event._id}/qr/${qrId}`);
      if (!res.ok) throw new Error("Failed to fetch QR");
      return res.json();
    },
    enabled: !isNew
  });

  const { data: templates } = useQuery({
    queryKey: ["qr-templates", event._id],
    queryFn: async () => {
      const res = await fetch(`/pahchaan/api/events/${event._id}/qr/templates`);
      if (!res.ok) throw new Error("Failed to fetch templates");
      return res.json();
    },
    enabled: isNew && !!templateId
  });

  const loadedTemplate = (templates as QRTemplate[])?.find((t: QRTemplate) => t._id === templateId);

  useEffect(() => {
    if (existingQR) {
      // Initialize without adding to history stack
      replaceName(existingQR.name);
      replaceDestination(existingQR.destinationUrl || existingQR.design.data || appUrl());
      replaceDesign(existingQR.design);
    } else if (isNew && templateId && templates) {
      const template = (templates as QRTemplate[]).find((t: QRTemplate) => t._id === templateId);
      if (template && template.design) {
        replaceDesign(template.design);
        replaceName(template.name);
      }
    }
  }, [existingQR, templates, templateId, isNew, replaceName, replaceDestination, replaceDesign]);

  const updateLoadedTemplateMutation = useMutation({
    mutationFn: async () => {
      if (!templateId) return;
      const res = await fetch(`/pahchaan/api/events/${event._id}/qr/templates/${templateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || loadedTemplate?.name || "My Template",
          design: design
        })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to update template");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qr-templates", event._id] });
      toast.success("Template design updated in real-time!");
    },
    onError: (err: unknown) => {
      toast.error((err as Error).message || "Failed to update template");
    }
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name,
        destinationUrl: destination,
        design: { ...design, data: destination },
        isDynamic: true,
        saveVersion: true,
        versionSummary: "Manual Save"
      };

      const url = isNew ? `/pahchaan/api/events/${event._id}/qr` : `/pahchaan/api/events/${event._id}/qr/${qrId}`;
      const method = isNew ? "POST" : "PATCH";

      // If PATCH, payload shape expected by our API is { updates: {...}, saveVersion: true }
      const finalPayload = isNew ? payload : { updates: payload, saveVersion: true, versionSummary: "User Saved" };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalPayload)
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: (data) => {
      toast.success("QR Code Saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["qrs", event._id] });
      if (isNew) {
        router.push(`/events/${event._id}/qr/${data._id}/design`);
      }
    },
    onError: (err: unknown) => {
      toast.error("Failed to save", { description: (err as Error).message || "An error occurred" });
    }
  });

  const saveTemplateMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: templateName || "My Custom Template",
        description: templateDesc || "Saved from QR Studio",
        design: design
      };
      const res = await fetch(`/pahchaan/api/events/${event._id}/qr/templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to save template");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qr-templates", event._id] });
      toast.success("Design saved to Templates Gallery!");
      setIsTemplateModalOpen(false);
      setTemplateName("");
      setTemplateDesc("");
    },
    onError: (err: Error) => {
      toast.error(err instanceof Error ? err.message : "Please try again.");
    }
  });

  const handlePublishAndClose = () => {
    saveMutation.mutate(undefined, {
      onSuccess: () => {
        router.push(`/events/${event._id}/qr`);
      }
    });
  };

  const handlePublishAndGetLink = () => {
    saveMutation.mutate(undefined, {
      onSuccess: () => {
        navigator.clipboard.writeText(destination);
        toast.success("Link copied to clipboard!");
      }
    });
  };

  // Export handling
  const handleExport = async (format: "png" | "svg" | "jpeg" | "webp" | "pdf") => {
    if (!qrRef.current) return;
    try {
      await QRExportService.exportSingleQR(qrRef.current, {
        name: name,
        format
      });
      
      if (!isNew) {
        fetch(`/pahchaan/api/events/${event._id}/qr/${qrId}/downloads`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ format })
        }).catch(console.error); // Fire and forget
      }

      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (err: unknown) {
      toast.error("Export failed", { description: (err as Error).message || "Export failed" });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] w-full bg-background overflow-hidden">
      
      {/* Top Application Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm">Design Studio</span>
          
          {loadedTemplate && (
            <Badge variant="secondary" className="text-xs flex items-center gap-1.5 py-0.5 px-2.5 font-medium rounded-full">
              <Sparkles className="w-3 h-3 text-muted-foreground" />
              Template: {loadedTemplate.name}
            </Badge>
          )}

          {/* History Tools */}
          <div className="flex items-center gap-1 border-l border-border pl-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={undo} disabled={!canUndo}>
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={redo} disabled={!canRedo}>
              <Redo2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => reset()} disabled={!canUndo && !canRedo}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => router.push(templateId ? `/events/${event._id}/qr/templates` : `/events/${event._id}/qr`)}>
                Cancel
              </Button>
              
              {templateId && loadedTemplate && !loadedTemplate.isSystem && (
                <Button 
                  size="sm" 
                  variant="default"
                  className="font-medium shadow-sm"
                  onClick={() => updateLoadedTemplateMutation.mutate()} 
                  disabled={updateLoadedTemplateMutation.isPending}
                >
                  {updateLoadedTemplateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-1.5" />
                      Update Template
                    </>
                  )}
                </Button>
              )}
              
              {generationMode === "bulk" ? (
                <Button 
                  size="sm" 
                  className="rounded-full px-6 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-medium shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
                  onClick={async () => {
                    try {
                      toast.loading("Generating bulk batch...", { id: "bulk-gen" });
                      const res = await fetch(`/pahchaan/api/events/${event._id}/qr/batch`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          name: name,
                          design: { ...design, data: destination },
                          options: bulkOptions,
                          destinationUrlBase: destination
                        })
                      });
                      if (!res.ok) throw new Error("Failed to generate batch");
                      const data = await res.json();
                      toast.success(`Successfully generated ${data.quantity} QR codes!`, { id: "bulk-gen" });
                      router.push(`/events/${event._id}/qr/batch/${data.batchId}`);
                    } catch (err: unknown) {
                      toast.error(err instanceof Error ? err.message : "Please try again.", { id: "bulk-gen" });
                    }
                  }}
                >
                  <Sparkles className="w-4 h-4 mr-2 text-white dark:text-zinc-900" />
                  Generate Batch
                </Button>
              ) : (
                <>
                  <Button variant="secondary" size="sm" onClick={() => saveMutation.mutate()}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Draft
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setIsTemplateModalOpen(true)}>
                    <Layout className="w-4 h-4 mr-2" />
                    Save as New Template
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={
                      <Button size="sm" variant={templateId ? "outline" : "default"} disabled={saveMutation.isPending}>
                        {saveMutation.isPending ? "Saving..." : "Publish QR"}
                      </Button>
                    } />
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handlePublishAndClose}>Publish & Close</DropdownMenuItem>
                      <DropdownMenuItem onClick={handlePublishAndGetLink}>Publish & Get Link</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
      </div>

      <PresetsToolbar onSelectPreset={(p) => setDesign(p)} />

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Configurator Accordion */}
        <ConfiguratorSidebar 
          name={name}
          setName={setName}
          destination={destination}
          setDestination={setDestination}
          design={design}
          setDesign={setDesign}
          isNew={isNew}
          onExport={handleExport}
          generationMode={generationMode}
          setGenerationMode={setGenerationMode}
          bulkOptions={bulkOptions}
          setBulkOptions={setBulkOptions}
        />

        {/* CENTER: Live Preview Pane */}
        <PreviewPanel 
          design={design} 
          destination={destination} 
          qrRef={qrRef} 
        />
      </div>

      {/* Save Template Modal */}
      <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save to Templates Gallery</DialogTitle>
            <DialogDescription>Save this QR code design to reuse in future campaigns.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Template Name</label>
              <Input 
                value={templateName} 
                onChange={e => setTemplateName(e.target.value)} 
                placeholder="e.g., VIP Summit Design" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description (Optional)</label>
              <Input 
                value={templateDesc} 
                onChange={e => setTemplateDesc(e.target.value)} 
                placeholder="Dark theme with gold logo" 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTemplateModalOpen(false)}>Cancel</Button>
            <Button onClick={() => saveTemplateMutation.mutate()} disabled={saveTemplateMutation.isPending || !templateName.trim()}>
              {saveTemplateMutation.isPending ? "Saving..." : "Save Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
