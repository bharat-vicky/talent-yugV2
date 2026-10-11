"use client";
import { appUrl } from "@/lib/brand";

import { useState } from "react";
import { useEvent } from "@/providers/event-provider";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreVertical, Pencil, Trash2, Play, Loader2, Sparkles } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QRTemplate } from "@/domain/types";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { QRCodeSVG } from "qrcode.react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function QRTemplatesPage() {
  const { event } = useEvent();
  const router = useRouter();
  const queryClient = useQueryClient();

  // State for Editing Template
  const [editingTemplate, setEditingTemplate] = useState<QRTemplate | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  // State for Deleting Template
  const [deletingTemplate, setDeletingTemplate] = useState<QRTemplate | null>(null);

  const { data: templates, isLoading } = useQuery<QRTemplate[]>({
    queryKey: ["qr-templates", event._id],
    queryFn: async () => {
      const res = await fetch(`/pahchaan/api/events/${event._id}/qr/templates`);
      if (!res.ok) throw new Error("Failed to fetch templates");
      return res.json();
    }
  });

  // Edit Mutation
  const editMutation = useMutation({
    mutationFn: async ({ templateId, name, description }: { templateId: string; name: string; description: string }) => {
      const res = await fetch(`/pahchaan/api/events/${event._id}/qr/templates/${templateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description })
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update template");
      }
      return res.json();
    },
    onMutate: async ({ templateId, name, description }) => {
      await queryClient.cancelQueries({ queryKey: ["qr-templates", event._id] });
      const previousTemplates = queryClient.getQueryData<QRTemplate[]>(["qr-templates", event._id]);
      
      if (previousTemplates) {
        queryClient.setQueryData<QRTemplate[]>(
          ["qr-templates", event._id],
          previousTemplates.map(t => (t._id === templateId ? { ...t, name, description } : t))
        );
      }
      return { previousTemplates };
    },
    onSuccess: () => {
      toast.success("Template updated successfully!");
      setEditingTemplate(null);
    },
    onError: (err: Error, _vars, context) => {
      if (context?.previousTemplates) {
        queryClient.setQueryData(["qr-templates", event._id], context.previousTemplates);
      }
      toast.error(err.message || "Failed to update template");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["qr-templates", event._id] });
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const res = await fetch(`/pahchaan/api/events/${event._id}/qr/templates/${templateId}`, {
        method: "DELETE"
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete template");
      }
      return res.json();
    },
    onMutate: async (templateId) => {
      await queryClient.cancelQueries({ queryKey: ["qr-templates", event._id] });
      const previousTemplates = queryClient.getQueryData<QRTemplate[]>(["qr-templates", event._id]);
      
      if (previousTemplates) {
        queryClient.setQueryData<QRTemplate[]>(
          ["qr-templates", event._id],
          previousTemplates.filter(t => t._id !== templateId)
        );
      }
      return { previousTemplates };
    },
    onSuccess: () => {
      toast.success("Template deleted successfully!");
      setDeletingTemplate(null);
    },
    onError: (err: Error, _vars, context) => {
      if (context?.previousTemplates) {
        queryClient.setQueryData(["qr-templates", event._id], context.previousTemplates);
      }
      toast.error(err.message || "Failed to delete template");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["qr-templates", event._id] });
    }
  });

  const handleOpenEdit = (template: QRTemplate) => {
    setEditingTemplate(template);
    setEditName(template.name);
    setEditDesc(template.description || "");
  };

  const handleSaveEdit = () => {
    if (!editingTemplate || !editName.trim()) return;
    editMutation.mutate({
      templateId: editingTemplate._id as string,
      name: editName.trim(),
      description: editDesc.trim()
    });
  };

  const handleApplyTemplate = (templateId: string) => {
    router.push(`/events/${event._id}/qr/new/design?templateId=${templateId}`);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Templates Gallery</h1>
          <p className="text-muted-foreground mt-1">Start from pre-designed templates or customize your saved designs in real-time.</p>
        </div>
        <Button onClick={() => router.push(`/events/${event._id}/qr/new/design`)} className="shadow-sm">
          <PlusCircle className="w-4 h-4 mr-2" />
          Create New Design
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-2xl"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {templates?.map((template) => (
            <Card key={template._id as string} className="flex flex-col overflow-hidden hover:border-foreground/30 transition-all shadow-sm rounded-2xl group relative bg-card">
              
              {/* QR Preview Box */}
              <div className="h-36 bg-muted/30 flex items-center justify-center border-b border-border/50 relative">
                <div className="w-24 h-24 bg-background rounded-2xl border shadow-sm flex items-center justify-center p-2 transition-transform duration-300 group-hover:scale-105">
                  <QRCodeSVG 
                    value={appUrl()}
                    size={80}
                    fgColor={template.design?.dotsOptions?.color || template.design?.cornersSquareOptions?.color || "#000000"}
                    bgColor={template.design?.backgroundOptions?.color === "transparent" ? "transparent" : (template.design?.backgroundOptions?.color || "#ffffff")}
                    imageSettings={template.design?.image ? {
                      src: template.design.image,
                      height: 20,
                      width: 20,
                      excavate: true
                    } : undefined}
                  />
                </div>

                {/* Top Action Menu for Templates */}
                <div className="absolute top-2.5 right-2.5">
                  <DropdownMenu>
                    <DropdownMenuTrigger render={
                      <Button 
                        variant="secondary" 
                        size="icon" 
                        className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-md hover:bg-background shadow-sm opacity-80 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="h-4 w-4 text-foreground" />
                      </Button>
                    } />
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => handleApplyTemplate(template._id as string)} className="cursor-pointer">
                        <Play className="w-4 h-4 mr-2 text-zinc-500" /> Use Template
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleOpenEdit(template)} className="cursor-pointer">
                        <Pencil className="w-4 h-4 mr-2 text-zinc-500" /> Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleApplyTemplate(template._id as string)} className="cursor-pointer">
                        <Sparkles className="w-4 h-4 mr-2 text-zinc-500" /> Customize in Studio
                      </DropdownMenuItem>
                      {!template.isSystem && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => setDeletingTemplate(template)} 
                            className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete Template
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <CardHeader className="py-4 px-5 flex-1">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-base font-bold line-clamp-1">{template.name}</CardTitle>
                  {template.isSystem && (
                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-full shrink-0 font-medium">System</Badge>
                  )}
                </div>
                <CardDescription className="line-clamp-2 text-xs mt-1 text-muted-foreground">
                  {template.description || "Saved from QR Studio"}
                </CardDescription>
              </CardHeader>

              <CardFooter className="p-5 pt-4 pb-5 border-t border-border/40 mt-auto">
                <div className="flex items-center gap-2 w-full">
                  <Button 
                    className="flex-1 rounded-xl font-medium h-10" 
                    variant="outline" 
                    onClick={() => handleApplyTemplate(template._id as string)}
                  >
                    Use Template
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground"
                    onClick={() => handleOpenEdit(template)}
                    title="Edit Template"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  {!template.isSystem && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-10 w-10 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeletingTemplate(template)}
                      title="Delete Template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
          
          {/* Blank Canvas Card */}
          <Card 
            className="flex flex-col overflow-hidden border-2 border-dashed bg-card/40 hover:bg-muted/20 hover:border-foreground/30 transition-all cursor-pointer rounded-2xl justify-center items-center p-8 text-center min-h-[260px] group" 
            onClick={() => router.push(`/events/${event._id}/qr/new/design`)}
          >
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <PlusCircle className="w-7 h-7 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            <p className="font-bold text-base text-foreground">Blank Canvas</p>
            <p className="text-xs text-muted-foreground mt-1">Design a new QR code from scratch</p>
          </Card>
        </div>
      )}

      {/* Edit Template Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Template</DialogTitle>
            <DialogDescription>
              Update the template title and description. Changes update in real-time.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label htmlFor="template-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Template Name *
              </Label>
              <Input 
                id="template-name"
                value={editName} 
                onChange={(e) => setEditName(e.target.value)} 
                placeholder="e.g. VIP Summit Dark Badge" 
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-desc" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Description (Optional)
              </Label>
              <Textarea 
                id="template-desc"
                value={editDesc} 
                onChange={(e) => setEditDesc(e.target.value)} 
                placeholder="e.g. Saved from QR Studio with custom dark palette" 
                className="min-h-[90px] rounded-xl resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditingTemplate(null)} className="rounded-xl">
              Cancel
            </Button>
            <Button 
              onClick={handleSaveEdit} 
              disabled={editMutation.isPending || !editName.trim()} 
              className="rounded-xl font-semibold"
            >
              {editMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingTemplate} onOpenChange={(open) => !open && setDeletingTemplate(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-destructive flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Delete Template
            </DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to delete <span className="font-semibold text-foreground">&quot;{deletingTemplate?.name}&quot;</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button variant="outline" onClick={() => setDeletingTemplate(null)} className="rounded-xl">
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deletingTemplate && deleteMutation.mutate(deletingTemplate._id as string)} 
              disabled={deleteMutation.isPending}
              className="rounded-xl font-semibold"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...
                </>
              ) : (
                "Delete Template"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
