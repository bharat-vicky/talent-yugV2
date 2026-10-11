"use client";

import type { FormField, RegistrationForm, RegistrationSubmission } from "@/domain/types";
import type { FormPresetDoc } from "@/app/api/events/form-presets/route";
import { useEvent } from "@/providers/event-provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Plus, Trash2, GripVertical, Check, X, Clock, Share2, Eye, Copy, ExternalLink, QrCode, Mail, Type, AlignLeft, ListFilter, UserCheck, Building, Phone, Code, Sparkles, Bookmark, FolderPlus, LayoutTemplate, FileText, Layers, ArrowRight, Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableFieldItem({ field, index, handleFieldChange, removeField }: {field:FormField;index:number;handleFieldChange:(index:number,key:string,value:unknown)=>void;removeField:(index:number)=>void}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: field.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const hasOptions = ["dropdown", "radio"].includes(field.type);

  const addOption = () => {
    const opts = field.options || [];
    handleFieldChange(index, "options", [...opts, `Option ${opts.length + 1}`]);
  };

  const updateOption = (optIndex: number, val: string) => {
    const opts = [...(field.options || [])];
    opts[optIndex] = val;
    handleFieldChange(index, "options", opts);
  };

  const removeOption = (optIndex: number) => {
    const opts = [...(field.options || [])];
    opts.splice(optIndex, 1);
    handleFieldChange(index, "options", opts);
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="flex flex-col gap-4 p-5 bg-card border border-border/80 border-l-4 border-l-zinc-900 dark:border-l-zinc-100 rounded-2xl relative group shadow-sm hover:shadow-md transition-all duration-200"
    >
      {/* Top Card Header Bar (MS Forms Question Bar) */}
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-3">
          <div 
            {...attributes} 
            {...listeners} 
            className="cursor-grab text-muted-foreground opacity-60 hover:opacity-100 touch-none p-1 rounded-md hover:bg-muted/50 transition-all"
            title="Drag to reorder question"
          >
            <GripVertical className="h-4 w-4" />
          </div>
          <span className="text-xs font-mono font-bold tracking-widest text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md border border-border/60">
            Q{index + 1}
          </span>
          <span className="text-xs font-medium text-muted-foreground capitalize">
            {field.type} Question
          </span>
        </div>

        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
          onClick={() => removeField(index)}
          title="Delete Question"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start pt-1">
        <div className="md:col-span-5">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Question Title</Label>
          <Input 
            value={field.label} 
            onChange={(e) => handleFieldChange(index, "label", e.target.value)} 
            placeholder="Enter your question title here..."
            className="bg-background h-10 font-medium text-sm rounded-xl"
          />
        </div>

        <div className="md:col-span-4">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Question Type</Label>
          <Select 
            value={field.type} 
            onValueChange={(val) => {
              handleFieldChange(index, "type", val);
              if ((val === "dropdown" || val === "radio") && (!field.options || field.options.length === 0)) {
                handleFieldChange(index, "options", ["Option 1", "Option 2"]);
              }
            }}
          >
            <SelectTrigger className="bg-background h-10 rounded-xl w-full text-xs font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="min-w-[230px] z-50">
              <SelectItem value="text" className="text-xs py-2">Short Text</SelectItem>
              <SelectItem value="textarea" className="text-xs py-2">Long Text / Paragraph</SelectItem>
              <SelectItem value="email" className="text-xs py-2">Email Address</SelectItem>
              <SelectItem value="phone" className="text-xs py-2">Phone Number</SelectItem>
              <SelectItem value="dropdown" className="text-xs py-2">Choice (Dropdown)</SelectItem>
              <SelectItem value="radio" className="text-xs py-2">Multiple Choice (Radio)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-3 flex items-center justify-end gap-5 pt-6">
          <div className="flex items-center space-x-2">
            <Switch 
              id={`req-${field.id}`} 
              checked={field.required}
              onCheckedChange={(c) => handleFieldChange(index, "required", c)}
            />
            <Label htmlFor={`req-${field.id}`} className="text-xs font-medium cursor-pointer">Required</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch 
              id={`hid-${field.id}`} 
              checked={field.hidden}
              onCheckedChange={(c) => handleFieldChange(index, "hidden", c)}
            />
            <Label htmlFor={`hid-${field.id}`} className="text-xs font-medium cursor-pointer">Hidden</Label>
          </div>
        </div>
      </div>

      {hasOptions && (
        <div className="pt-3 border-t border-border/40 mt-1">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Choice Options</Label>
          <div className="flex flex-col gap-2.5">
            {(field.options || []).map((opt: string, optIndex: number) => (
              <div key={optIndex} className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/40 shrink-0" />
                <Input 
                  value={opt} 
                  onChange={(e) => updateOption(optIndex, e.target.value)} 
                  className="h-9 text-sm rounded-lg bg-background"
                  placeholder={`Option ${optIndex + 1}`}
                />
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-lg" onClick={() => removeOption(optIndex)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addOption} className="w-fit mt-1 h-9 text-xs border-dashed rounded-xl px-4 font-semibold">
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Option
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RegistrationPage() {
  const { event } = useEvent();
  const [formConfig, setFormConfig] = useState<RegistrationForm | null>(null);
  const [submissions, setSubmissions] = useState<(Omit<RegistrationSubmission, "_id"> & { _id: string; qrCodeId?: string })[]>([]);
  const [loadingForm, setLoadingForm] = useState(true);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("builder");

  const [savedTemplates, setSavedTemplates] = useState<FormPresetDoc[]>([]);
  const [saveTemplateDialogOpen, setSaveTemplateDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateCategory, setNewTemplateCategory] = useState("Custom");
  const [templateFilterCategory, setTemplateFilterCategory] = useState("All");
  const [selectedPreviewPreset, setSelectedPreviewPreset] = useState<FormPresetDoc | null>(null);

  const fetchGlobalPresets = async () => {
    try {
      const res = await fetch("/pahchaan/api/events/form-presets");
      if (res.ok) {
        const json = await res.json();
        const apiPresets = (json.data || []).map((p: FormPresetDoc) => ({
          ...p,
          id: p._id || p.id
        }));

        let localPresets: FormPresetDoc[] = [];
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem("identity_saved_form_templates");
          if (stored) {
            localPresets = JSON.parse(stored);
          }
        }

        // Merge API presets and local presets uniquely by id / name
        const combinedMap = new Map();
        [...localPresets, ...apiPresets].forEach((item) => {
          if (item && (item.id || item._id)) {
            combinedMap.set(item.id || item._id, item);
          }
        });

        const merged = Array.from(combinedMap.values());
        setSavedTemplates(merged);
        if (typeof window !== "undefined") {
          localStorage.setItem("identity_saved_form_templates", JSON.stringify(merged));
        }
      }
    } catch (e) {
      console.error(e);
      // Fallback to local storage
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("identity_saved_form_templates");
          if (stored) setSavedTemplates(JSON.parse(stored));
        } catch (err) {}
      }
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );



  const fetchFormConfig = async () => {
    try {
      const res = await fetch(`/pahchaan/api/events/${event._id}/registration/schema`);
      if (res.ok) {
        const data = await res.json();
        setFormConfig(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingForm(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const res = await fetch(`/pahchaan/api/events/${event._id}/registration/submissions`);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSubmissions(false);
    }
  };



  useEffect(() => {
    const controller = new AbortController();
    fetch('/pahchaan/api/events/form-presets', { signal: controller.signal }).then(r=>r.json()).then(data=>setSavedTemplates((data.data || []).map((preset: FormPresetDoc)=>({...preset,id:preset._id || preset.id})))).catch(()=>{});
    fetch(`/pahchaan/api/events/${event._id}/registration/schema`, { signal: controller.signal }).then(r=>r.json()).then(data=>setFormConfig(data)).finally(()=>setLoadingForm(false)).catch(()=>{});
    fetch(`/pahchaan/api/events/${event._id}/registration/submissions`, { signal: controller.signal }).then(r=>r.json()).then(data=>setSubmissions(data)).finally(()=>setLoadingSubmissions(false)).catch(()=>{});
    return ()=>controller.abort();
  }, [event._id]);

  const handleSettingChange = (key: string, checked: boolean) => {
    setFormConfig((prev) => prev ? ({
      ...prev,
      settings: {
        ...prev.settings,
        [key]: checked,
      },
    }) : prev);
  };

  const handleBrandingChange = (key: string, value: unknown) => {
    setFormConfig((prev) => prev ? ({
      ...prev,
      branding: {
        ...prev?.branding,
        [key]: value,
      },
    }) : prev);
  };

  const handleFieldChange = (index: number, key: string, value: unknown) => {
    if (!formConfig) return;
    const newFields = formConfig.fields.map((field,i) => i === index ? { ...field, [key]: value } : field);
    setFormConfig((prev) => prev ? ({ ...prev, fields: newFields }) : prev);
  };

  const addField = () => {
    addPresetField("custom");
  };

  const addPresetField = (preset: "text" | "textarea" | "email" | "phone" | "dropdown" | "radio" | "role" | "company" | "custom") => {
    const id = "field_" + Math.random().toString(36).substr(2, 9);
    let newField: FormField = {
      id,
      type: "text",
      label: "New Question",
      required: false,
      hidden: false,
      readOnly: false,
      width: "full"
    };

    if (preset === "textarea") {
      newField = { ...newField, type: "textarea", label: "Long Text Question" };
    } else if (preset === "email") {
      newField = { ...newField, type: "email", label: "Email Address", required: true };
    } else if (preset === "phone") {
      newField = { ...newField, type: "phone", label: "Phone Number" };
    } else if (preset === "dropdown") {
      newField = { ...newField, type: "dropdown", label: "Choice Question", options: ["Option 1", "Option 2"] };
    } else if (preset === "radio") {
      newField = { ...newField, type: "radio", label: "Multiple Choice Question", options: ["Option 1", "Option 2"] };
    } else if (preset === "role") {
      newField = { ...newField, type: "text", label: "Role / Job Title", width: "half" };
    } else if (preset === "company") {
      newField = { ...newField, type: "text", label: "Company / Organization", width: "half" };
    }

    setFormConfig((prev) => prev ? ({ ...prev, fields: [...(prev?.fields || []), newField] }) : prev);
  };

  const removeField = (index: number) => {
    if (!formConfig) return;
    const newFields = [...formConfig.fields];
    newFields.splice(index, 1);
    setFormConfig((prev) => prev ? ({ ...prev, fields: newFields }) : prev);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setFormConfig((prev) => {
        if (!prev || !over) return prev;
        const oldIndex = prev.fields.findIndex((f: FormField) => f.id === active.id);
        const newIndex = prev.fields.findIndex((f: FormField) => f.id === over?.id);
        return {
          ...prev,
          fields: arrayMove(prev.fields, oldIndex, newIndex),
        };
      });
    }
  };

  const saveFormConfig = async () => {
    if (!formConfig) return;
    setSaving(true);
    try {
      const res = await fetch(`/pahchaan/api/events/${event._id}/registration/schema`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: formConfig.settings,
          fields: formConfig.fields,
          branding: formConfig.branding,
        }),
      });

      if (res.ok) {
        toast.success("Registration form saved");
      } else {
        toast.error("Failed to save form");
      }
    } catch (e) {
      toast.error("An error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmissionAction = async (submissionId: string, action: 'approve' | 'reject' | 'waitlist') => {
    try {
      const res = await fetch(`/pahchaan/api/events/${event._id}/registration/submissions/${submissionId}/${action}`, {
        method: "POST"
      });
      if (res.ok) {
        toast.success(`Submission ${action}d successfully`);
        fetchSubmissions(); // reload submissions
      } else {
        toast.error(`Failed to ${action} submission`);
      }
    } catch (e) {
      toast.error("An error occurred");
    }
  };

  const saveCurrentAsTemplate = async () => {
    if (!newTemplateName.trim()) {
      toast.error("Please enter a name for your form preset");
      return;
    }

    const customTmpl = {
      id: "custom_tmpl_" + Date.now(),
      name: newTemplateName.trim(),
      category: newTemplateCategory || "Custom",
      description: formConfig?.branding?.description || `Custom form preset with ${formConfig?.fields?.length || 0} questions.`,
      isCustom: true,
      createdAt: new Date().toISOString(),
      fields: formConfig?.fields ? JSON.parse(JSON.stringify(formConfig.fields)) : []
    };

    const updatedTemplates = [customTmpl, ...savedTemplates];
    setSavedTemplates(updatedTemplates);
    
    if (typeof window !== "undefined") {
      localStorage.setItem("identity_saved_form_templates", JSON.stringify(updatedTemplates));
    }

    try {
      await fetch("/pahchaan/api/events/form-presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customTmpl)
      });
    } catch (e) {
      console.error(e);
    }

    setSaveTemplateDialogOpen(false);
    setNewTemplateName("");
    toast.success(`Preset "${customTmpl.name}" saved globally for all events!`);
    setActiveTab("templates");
  };

  const applyTemplate = (template: FormPresetDoc) => {
    setFormConfig((prev) => prev ? ({
      ...prev,
      fields: template.fields.map((f: FormField) => ({
        ...f,
        id: "field_" + Math.random().toString(36).substr(2, 9)
      })),
      branding: {
        ...prev?.branding,
        title: template.name,
        description: template.description
      }
    }) : prev);
    toast.success(`Preset "${template.name}" applied to Form Builder!`);
    setActiveTab("builder");
  };

  const deleteCustomTemplate = async (templateId: string) => {
    const updated = savedTemplates.filter(t => (t.id !== templateId && t._id !== templateId));
    setSavedTemplates(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("identity_saved_form_templates", JSON.stringify(updated));
    }

    try {
      await fetch(`/pahchaan/api/events/form-presets?id=${templateId}`, {
        method: "DELETE"
      });
    } catch (e) {
      console.error(e);
    }

    toast.success("Preset deleted");
  };

  const [shareModalOpen, setShareModalOpen] = useState(false);
  const publicFormUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/pahchaan/r/${event.uniqueSlug || event.slug}` 
    : `/pahchaan/r/${event.uniqueSlug || event.slug}`;

  return (
    <div className="flex flex-col gap-8 w-full p-6 md:p-10">
      {/* MS Forms Top Navigation Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card border border-border/80 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{event.name || "Event"} Registration</h1>
            <span className="text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              Active Form
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <a 
            href={`/pahchaan/r/${event.uniqueSlug || event.slug}`} 
            target="_blank" 
            rel="noreferrer"
          >
            <Button variant="outline" size="sm" className="rounded-xl h-10 px-4 text-xs font-semibold cursor-pointer">
              <Eye className="w-4 h-4 mr-2" /> Preview
            </Button>
          </a>

          <Button 
            onClick={() => setShareModalOpen(true)} 
            size="sm" 
            className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 font-semibold rounded-xl h-10 px-5 text-xs shadow-sm cursor-pointer"
          >
            <Share2 className="w-4 h-4 mr-2" /> Collect Responses / Share Form
          </Button>

          <Button onClick={() => setSaveTemplateDialogOpen(true)} variant="outline" size="sm" className="rounded-xl h-10 px-4 text-xs font-semibold cursor-pointer">
            <Bookmark className="w-4 h-4 mr-2 text-amber-500" /> Save Preset
          </Button>

          <Button onClick={saveFormConfig} disabled={saving} size="sm" className="rounded-xl h-10 px-5 text-xs font-semibold cursor-pointer">
            {saving ? "Saving..." : "Save Form"}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col gap-6">
        <TabsList className="w-full justify-start h-14 p-1.5 bg-card/50 border border-border/50 rounded-xl overflow-x-auto flex-nowrap backdrop-blur-xl shadow-sm">
          <TabsTrigger value="builder" className="rounded-lg px-6 py-2.5 text-sm font-medium">Form Builder</TabsTrigger>
          <TabsTrigger value="submissions" className="rounded-lg px-6 py-2.5 text-sm font-medium">Responses ({submissions.length})</TabsTrigger>
          <TabsTrigger value="templates" className="rounded-lg px-6 py-2.5 text-sm font-medium flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4 text-primary" /> Form Presets ({savedTemplates.length})
          </TabsTrigger>
          <TabsTrigger value="settings" className="rounded-lg px-6 py-2.5 text-sm font-medium">Settings</TabsTrigger>
        </TabsList>

        <div className="flex-1 bg-card border border-border/50 rounded-2xl p-8 shadow-sm">
          
          {/* TAB: FORM BUILDER */}
          <TabsContent value="builder" className="mt-0 flex flex-col gap-8">
            {/* MS Forms Quick Start Question Selector Grid */}
            <div className="bg-muted/20 border border-border/60 rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Plus className="w-4 h-4 text-primary" /> Add Questions to Form
                </span>
                <span className="text-[11px] text-muted-foreground">Click any type to instantly add to form</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                <Button variant="outline" size="sm" onClick={() => addPresetField("dropdown")} className="h-12 rounded-xl flex flex-col gap-1 items-center justify-center border-border/80 hover:border-zinc-900 dark:hover:border-white transition-all bg-background">
                  <ListFilter className="w-4 h-4 text-indigo-500" />
                  <span className="text-[11px] font-semibold">Choice</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => addPresetField("text")} className="h-12 rounded-xl flex flex-col gap-1 items-center justify-center border-border/80 hover:border-zinc-900 dark:hover:border-white transition-all bg-background">
                  <Type className="w-4 h-4 text-blue-500" />
                  <span className="text-[11px] font-semibold">Short Text</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => addPresetField("textarea")} className="h-12 rounded-xl flex flex-col gap-1 items-center justify-center border-border/80 hover:border-zinc-900 dark:hover:border-white transition-all bg-background">
                  <AlignLeft className="w-4 h-4 text-emerald-500" />
                  <span className="text-[11px] font-semibold">Paragraph</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => addPresetField("email")} className="h-12 rounded-xl flex flex-col gap-1 items-center justify-center border-border/80 hover:border-zinc-900 dark:hover:border-white transition-all bg-background">
                  <Mail className="w-4 h-4 text-rose-500" />
                  <span className="text-[11px] font-semibold">Email</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => addPresetField("phone")} className="h-12 rounded-xl flex flex-col gap-1 items-center justify-center border-border/80 hover:border-zinc-900 dark:hover:border-white transition-all bg-background">
                  <Phone className="w-4 h-4 text-amber-500" />
                  <span className="text-[11px] font-semibold">Phone</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => addPresetField("role")} className="h-12 rounded-xl flex flex-col gap-1 items-center justify-center border-border/80 hover:border-zinc-900 dark:hover:border-white transition-all bg-background">
                  <UserCheck className="w-4 h-4 text-purple-500" />
                  <span className="text-[11px] font-semibold">Role</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => addPresetField("company")} className="h-12 rounded-xl flex flex-col gap-1 items-center justify-center border-border/80 hover:border-zinc-900 dark:hover:border-white transition-all bg-background">
                  <Building className="w-4 h-4 text-cyan-500" />
                  <span className="text-[11px] font-semibold">Company</span>
                </Button>
              </div>
            </div>

            {loadingForm ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ) : formConfig ? (
              <div className="flex flex-col gap-6">
                {/* MS Forms Form Title & About / Description Header Editor */}
                <div className="bg-card border border-border/80 border-l-4 border-l-zinc-900 dark:border-l-zinc-100 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-border/40 pb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-zinc-900 dark:text-zinc-100" /> Form Title & About / Description
                    </span>
                    <span className="text-[11px] text-muted-foreground">Main title and about details shown on public registration page</span>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Form Title</Label>
                      <Input 
                        value={formConfig.branding?.title ?? event.name ?? ""}
                        onChange={(e) => handleBrandingChange("title", e.target.value)}
                        placeholder="Enter form title..."
                        className="h-11 text-base font-bold rounded-xl bg-background"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">About Form / Description</Label>
                      <Textarea 
                        value={formConfig.branding?.description ?? event.description ?? ""}
                        onChange={(e) => handleBrandingChange("description", e.target.value)}
                        placeholder="Enter event details, instructions, or welcome note for attendees..."
                        className="min-h-[85px] text-sm rounded-xl bg-background resize-y"
                      />
                    </div>
                  </div>
                </div>

                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext 
                    items={formConfig.fields.map((f: FormField) => f.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex flex-col gap-4">
                      {formConfig.fields.map((field: FormField, index: number) => (
                        <SortableFieldItem 
                          key={field.id}
                          field={field} 
                          index={index} 
                          handleFieldChange={handleFieldChange} 
                          removeField={removeField} 
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>

                <div className="pt-6 mt-4 border-t border-border flex justify-between items-center gap-3">
                  <Button variant="outline" onClick={() => addPresetField("text")} className="rounded-xl font-semibold text-xs h-11 border-dashed">
                    <Plus className="h-4 w-4 mr-2" /> Add Question
                  </Button>
                  
                  <div className="flex items-center gap-3">
                    <Button onClick={() => setSaveTemplateDialogOpen(true)} variant="outline" className="rounded-xl h-11 px-5 text-xs font-semibold">
                      <Bookmark className="w-4 h-4 mr-2 text-amber-500" /> Save Preset
                    </Button>
                    <Button onClick={() => setShareModalOpen(true)} variant="outline" className="rounded-xl h-11 px-5 text-xs font-semibold">
                      <Share2 className="w-4 h-4 mr-2" /> Share Link
                    </Button>
                    <Button onClick={saveFormConfig} disabled={saving} size="lg" className="px-8 font-semibold rounded-xl">
                      {saving ? "Saving Form..." : "Save Form"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground">Failed to load form configuration.</div>
            )}
          </TabsContent>

          {/* TAB: FORM PRESETS */}
          <TabsContent value="templates" className="mt-0 flex flex-col gap-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold tracking-tight">Form Presets Library</h2>
                  <span className="text-xs font-semibold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full border border-primary/20">
                    {savedTemplates.length} Presets
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">Save your custom forms as reusable presets to quickly apply across future events.</p>
              </div>

              <Button onClick={() => setSaveTemplateDialogOpen(true)} className="rounded-xl h-10 px-5 text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900">
                <FolderPlus className="w-4 h-4 mr-2" /> Save Form as Preset
              </Button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {["All", "Custom", "Hackathon", "Conference", "VIP & Gala", "Workshop"].map((cat) => (
                <Button
                  key={cat}
                  variant={templateFilterCategory === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTemplateFilterCategory(cat)}
                  className="rounded-full text-xs font-medium px-4 h-8 shrink-0"
                >
                  {cat}
                </Button>
              ))}
            </div>

            {/* Presets Grid or Empty State */}
            {savedTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border/80 rounded-2xl bg-muted/10 gap-3">
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
                  <Bookmark className="w-6 h-6" />
                </div>
                <div className="flex flex-col gap-1 max-w-md">
                  <h3 className="text-lg font-bold text-foreground">No Saved Form Presets Yet</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Design your registration form in the Form Builder and click <span className="font-semibold text-foreground">&quot;Save Preset&quot;</span> to store your custom form layout here for future events.
                  </p>
                </div>
                <Button onClick={() => setSaveTemplateDialogOpen(true)} className="mt-2 rounded-xl h-10 px-5 text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900">
                  <FolderPlus className="w-4 h-4 mr-2" /> Save Form as Preset
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {savedTemplates
                  .filter((t) => templateFilterCategory === "All" || (templateFilterCategory === "Custom" ? t.isCustom : t.category === templateFilterCategory))
                  .map((template) => (
                    <div key={template.id} className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-5 relative group">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                            {template.category || "General"}
                          </span>

                          <span className="text-xs font-mono font-semibold text-muted-foreground flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" /> {template.fields?.length || 0} Questions
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-foreground leading-snug break-words [overflow-wrap:anywhere]">{template.name}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 break-words [overflow-wrap:anywhere]">{template.description}</p>

                        {/* Questions Preview List */}
                        <div className="bg-muted/30 border border-border/40 rounded-xl p-3.5 flex flex-col gap-1.5 mt-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Included Questions:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {(template.fields || []).slice(0, 4).map((f: FormField, idx: number) => (
                              <span key={idx} className="text-[11px] font-medium bg-background border border-border/60 text-foreground px-2 py-0.5 rounded-md truncate max-w-[140px]">
                                {f.label}
                              </span>
                            ))}
                            {(template.fields?.length || 0) > 4 && (
                              <span className="text-[11px] font-medium bg-background border border-border/60 text-muted-foreground px-2 py-0.5 rounded-md">
                                +{(template.fields?.length || 0) - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-border/40 pt-4 mt-1">
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setSelectedPreviewPreset(template)}
                            className="text-xs rounded-xl h-9 px-3.5 font-medium border-border/80 hover:bg-muted"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1.5 text-blue-500" /> View
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => deleteCustomTemplate(template.id || template._id || "")}
                            className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl h-9 px-3"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                          </Button>
                        </div>

                        <Button 
                          onClick={() => applyTemplate(template)} 
                          size="sm" 
                          className="rounded-xl h-9 px-5 text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
                        >
                          Apply Preset <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </TabsContent>

          {/* TAB: SUBMISSIONS */}
          <TabsContent value="submissions" className="mt-0 flex flex-col gap-8">
            <div className="flex flex-col gap-2 border-b border-border pb-6">
              <h2 className="text-2xl font-semibold tracking-tight">Recent Submissions</h2>
              <p className="text-muted-foreground">View and manage registrations for your event.</p>
            </div>

            {loadingSubmissions ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
            ) : submissions.length > 0 ? (
              <div className="border border-border/50 rounded-xl overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border/50">
                    <tr>
                      {formConfig?.fields?.map((field: FormField) => (
                        <th key={field.id} className="px-6 py-4 whitespace-nowrap">{field.label}</th>
                      ))}
                      <th className="px-6 py-4 whitespace-nowrap">Status</th>
                      <th className="px-6 py-4 whitespace-nowrap">QR Status</th>
                      <th className="px-6 py-4 whitespace-nowrap">Submitted At</th>
                      <th className="px-6 py-4 text-right whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {submissions.map((sub) => (
                        <tr key={sub._id} className="hover:bg-muted/20 transition-colors">
                          {formConfig?.fields?.map((field: FormField) => (
                            <td key={field.id} className="px-6 py-4 whitespace-nowrap text-zinc-800">
                              {sub.answers && sub.answers[field.id] !== undefined ? String(sub.answers[field.id]) : <span className="text-muted-foreground italic">-</span>}
                            </td>
                          ))}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              sub.status === 'approved' ? 'bg-green-100 text-green-800' :
                              sub.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              sub.status === 'waitlisted' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {sub.qrCodeId ? (
                              <span className="inline-flex items-center text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200">
                                Generated
                              </span>
                            ) : sub.status === 'pending' ? (
                              <span className="text-xs text-muted-foreground italic">Pending Approval</span>
                            ) : sub.status === 'approved' ? (
                              <span className="text-xs text-zinc-500 bg-zinc-100 px-2 py-1 rounded">Not Generated</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                            {format(new Date(sub.submittedAt), "MMM d, yyyy h:mm a")}
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              {(sub.guestId || sub.qrCodeId) && (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-zinc-700 hover:text-zinc-900 border-zinc-200 hover:bg-zinc-100 rounded-lg cursor-pointer text-xs font-medium" 
                                  onClick={() => window.location.href = `/pahchaan/events/${sub.eventId || event._id}/guests/${sub.guestId || sub._id}`}
                                >
                                  View QR
                                </Button>
                              )}
                              {sub.status === 'pending' && (
                                <>
                                  <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleSubmissionAction(sub._id, 'approve')}>
                                    <Check className="h-4 w-4 mr-1" /> Approve
                                  </Button>
                                  <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleSubmissionAction(sub._id, 'reject')}>
                                    <X className="h-4 w-4 mr-1" /> Reject
                                  </Button>
                                  <Button size="sm" variant="outline" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleSubmissionAction(sub._id, 'waitlist')}>
                                    <Clock className="h-4 w-4 mr-1" /> Waitlist
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border/50 rounded-xl bg-muted/10">
                <h3 className="text-lg font-semibold mb-2">No registration submissions yet</h3>
                <p className="text-muted-foreground">When guests register for your event, their submissions will appear here.</p>
              </div>
            )}
          </TabsContent>

          {/* TAB: SETTINGS */}
          <TabsContent value="settings" className="mt-0 flex flex-col gap-8">
            <div className="flex flex-col gap-2 border-b border-border pb-6">
              <h2 className="text-2xl font-semibold tracking-tight">Registration Settings</h2>
              <p className="text-muted-foreground">Configure how your registration flow behaves.</p>
            </div>

            {loadingForm ? (
              <div className="space-y-6">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ) : formConfig ? (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between p-5 rounded-xl border border-border/50 bg-muted/20">
                  <div className="flex flex-col gap-1">
                    <Label className="text-base font-semibold">Auto Approve Registrations</Label>
                    <span className="text-sm text-muted-foreground">Automatically approve guests when they register.</span>
                  </div>
                  <Switch
                    checked={formConfig.settings?.autoApprove}
                    onCheckedChange={(c) => handleSettingChange("autoApprove", c)}
                  />
                </div>



                <div className="flex items-center justify-between p-5 rounded-xl border border-border/50 bg-muted/20">
                  <div className="flex flex-col gap-1">
                    <Label className="text-base font-semibold">Generate QR Codes</Label>
                    <span className="text-sm text-muted-foreground">Automatically generate a QR code for approved registrations.</span>
                  </div>
                  <Switch
                    checked={formConfig.settings?.generateQR}
                    onCheckedChange={(c) => handleSettingChange("generateQR", c)}
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <Button onClick={saveFormConfig} disabled={saving} size="lg" className="bg-primary text-primary-foreground font-semibold px-8">
                    {saving ? "Saving..." : "Save Settings"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground">Failed to load form configuration.</div>
            )}
          </TabsContent>
        </div>
      </Tabs>

      {/* MS Forms Collect Responses / Share Link Modal */}
      <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Share2 className="w-5 h-5 text-zinc-900 dark:text-zinc-100" /> Collect Responses & Share Form
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Anyone with this link can fill out your registration form after verifying their email with a code. Entry passes follow your approval settings.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Public Form Link</Label>
              <div className="flex items-center gap-2">
                <Input 
                  value={publicFormUrl} 
                  readOnly 
                  className="bg-muted/30 font-mono text-xs h-10 rounded-xl"
                />
                <Button 
                  onClick={() => {
                    navigator.clipboard.writeText(publicFormUrl);
                    toast.success("Public form link copied to clipboard!");
                  }}
                  size="sm"
                  className="rounded-xl h-10 px-4 shrink-0 font-semibold bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900"
                >
                  <Copy className="w-4 h-4 mr-1.5" /> Copy
                </Button>
              </div>
            </div>

            <div className="p-4 bg-muted/20 rounded-xl border border-border/50 flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-foreground">Open in New Tab</span>
                <span className="text-[11px] text-muted-foreground">Test guest submission live</span>
              </div>
              <a href={publicFormUrl} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm" className="rounded-lg h-9 text-xs font-semibold">
                  <ExternalLink className="w-3.5 h-3.5 mr-1" /> Open Form
                </Button>
              </a>
            </div>

            <div className="p-4 bg-muted/20 rounded-xl border border-border/50 flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-foreground">Embed Code (iFrame)</span>
                <span className="text-[11px] text-muted-foreground">Embed on your website or landing page</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-lg h-9 text-xs font-semibold"
                onClick={() => {
                  const embedCode = `<iframe src="${publicFormUrl}" width="100%" height="700" frameborder="0"></iframe>`;
                  navigator.clipboard.writeText(embedCode);
                  toast.success("iFrame embed code copied!");
                }}
              >
                <Code className="w-3.5 h-3.5 mr-1" /> Copy Code
              </Button>
            </div>
          </div>

          <DialogFooter className="sm:justify-end">
            <Button variant="secondary" onClick={() => setShareModalOpen(false)} className="rounded-xl font-semibold">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Preset Modal Dialog */}
      <Dialog open={saveTemplateDialogOpen} onOpenChange={setSaveTemplateDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Bookmark className="w-5 h-5 text-amber-500" /> Save Form as Reusable Preset
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Save the current form questions and settings as a preset to reuse across future events.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Preset Name</Label>
              <Input 
                value={newTemplateName} 
                onChange={(e) => setNewTemplateName(e.target.value)} 
                placeholder="e.g. Developer Hackathon Preset 2026" 
                className="h-11 rounded-xl text-sm font-medium"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category Tag</Label>
              <Select value={newTemplateCategory} onValueChange={(val) => setNewTemplateCategory(val || "Custom")}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Custom">Custom</SelectItem>
                  <SelectItem value="Hackathon">Hackathon</SelectItem>
                  <SelectItem value="Conference">Conference</SelectItem>
                  <SelectItem value="VIP & Gala">VIP & Gala</SelectItem>
                  <SelectItem value="Workshop">Workshop</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-3.5 bg-muted/20 rounded-xl border border-border/50 flex items-center justify-between text-xs text-muted-foreground">
              <span>Questions to be included:</span>
              <span className="font-bold text-foreground font-mono">{formConfig?.fields?.length || 0} Questions</span>
            </div>
          </div>

          <DialogFooter className="sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setSaveTemplateDialogOpen(false)} className="rounded-xl font-semibold">
              Cancel
            </Button>
            <Button onClick={saveCurrentAsTemplate} className="rounded-xl font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900">
              Save & View Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preset View / Preview Modal Dialog */}
      <Dialog open={!!selectedPreviewPreset} onOpenChange={(open) => !open && setSelectedPreviewPreset(null)}>
        <DialogContent className="sm:max-w-xl rounded-2xl max-h-[85vh] overflow-y-auto">
          {selectedPreviewPreset && (
            <>
              <DialogHeader className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                    {selectedPreviewPreset.category || "Custom Preset"}
                  </span>

                  <span className="text-xs font-mono font-semibold text-muted-foreground flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-primary" /> {selectedPreviewPreset.fields?.length || 0} Questions
                  </span>
                </div>

                <DialogTitle className="text-2xl font-bold tracking-tight text-foreground break-words [overflow-wrap:anywhere]">
                  {selectedPreviewPreset.name}
                </DialogTitle>
                
                {selectedPreviewPreset.description && (
                  <DialogDescription className="text-xs text-muted-foreground leading-relaxed break-words [overflow-wrap:anywhere]">
                    {selectedPreviewPreset.description}
                  </DialogDescription>
                )}
              </DialogHeader>

              {/* Full Question List Preview */}
              <div className="flex flex-col gap-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-primary" /> Form Questions Overview ({selectedPreviewPreset.fields?.length || 0})
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {(selectedPreviewPreset.fields || []).map((field: FormField, index: number) => (
                    <div 
                      key={field.id || index}
                      className="p-4 bg-muted/20 border border-border/70 rounded-xl flex flex-col gap-2 border-l-4 border-l-zinc-900 dark:border-l-zinc-100"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono px-2 py-0.5 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-md">
                            Q{index + 1}
                          </span>
                          <span className="text-sm font-semibold text-foreground break-words [overflow-wrap:anywhere]">
                            {field.label}
                          </span>
                          {field.required && (
                            <span className="text-xs font-bold text-red-500">*</span>
                          )}
                        </div>

                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-background border border-border/80 text-muted-foreground shrink-0">
                          {field.type}
                        </span>
                      </div>

                      {/* Display Field Options if choice or dropdown */}
                      {Array.isArray(field.options) && field.options.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1 pt-2 border-t border-border/40">
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase">Options:</span>
                          {field.options.map((opt: string, oIdx: number) => (
                            <span key={oIdx} className="text-[11px] font-medium bg-background border border-border/60 text-foreground px-2 py-0.5 rounded-md">
                              {opt}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter className="sm:justify-between gap-2 border-t border-border pt-4">
                <Button variant="outline" onClick={() => setSelectedPreviewPreset(null)} className="rounded-xl font-semibold text-xs">
                  Close Preview
                </Button>
                
                <Button 
                  onClick={() => {
                    applyTemplate(selectedPreviewPreset);
                    setSelectedPreviewPreset(null);
                  }} 
                  className="rounded-xl font-semibold text-xs bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
                >
                  Apply Preset to Form Builder <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
