"use client";

import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  Plus, 
  LayoutTemplate, 
  Layers,
  ChevronDown,
  Check,
  Star
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { TemplateCard } from "./TemplateCard";
import { GettingStartedCard } from "./GettingStartedCard";
import { StatisticsRow } from "./StatisticsRow";
import { EventTemplate } from "@/domain/types";
import { toast } from "sonner";
import { LoadingState } from "@/components/ui/loading-state";

const CATEGORIES = [
  "All", "Conference", "Corporate", "Startup", "Hackathon", 
  "Workshop", "Meetup", "Education", "Wedding", "Festival", 
  "Sports", "Government", "Healthcare", "Music", "Custom"
];

const SORTS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "popular", label: "Most Popular" },
];

interface TemplatesClientProps {
  workspaceId: string;
}

export function TemplatesClient({ workspaceId }: TemplatesClientProps) {
  const queryClient = useQueryClient();
  
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [tab, setTab] = useState("workspace");
  const [dismissStarted, setDismissStarted] = useState(false);

  const fetchTemplates = async (isOfficial?: boolean) => {
    const params = new URLSearchParams({
      workspaceId,
      page: "1",
      limit: "50",
    });
    if (search) params.append("search", search);
    if (category !== "All") params.append("category", category);
    if (isOfficial !== undefined) params.append("isOfficial", isOfficial.toString());

    const res = await fetch(`/pahchaan/api/templates?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch templates");
    return res.json();
  };

  const { data: workspaceData, isLoading: isLoadingWorkspace } = useQuery({
    queryKey: ["templates", workspaceId, search, category, "workspace"],
    queryFn: () => fetchTemplates(false),
  });

  const { data: officialData, isLoading: isLoadingOfficial } = useQuery({
    queryKey: ["templates", workspaceId, search, category, "official"],
    queryFn: () => fetchTemplates(true),
  });

  const actionMutation = useMutation({
    mutationFn: async ({ templateId, action }: { templateId: string, action: string }) => {
      const res = await fetch(`/pahchaan/api/templates/${templateId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, action }),
      });
      if (!res.ok) throw new Error(`Failed to ${action} template`);
      return res.json();
    },
    onSuccess: (data, variables) => {
      toast.success(`Template ${variables.action}d successfully`);
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
    onError: (error) => {
      toast.error((error as Error).message);
    }
  });

  const handleAction = useCallback((action: string, templateId: string) => {
    if (action === "preview") {
      toast.info("Preview mode not yet implemented for this sprint");
      return;
    }
    if (action === "delete") {
      if (!confirm("Are you sure you want to delete this template?")) return;
      fetch(`/pahchaan/api/templates/${templateId}?workspaceId=${workspaceId}`, { method: 'DELETE' })
        .then(() => {
          toast.success("Template deleted");
          queryClient.invalidateQueries({ queryKey: ["templates"] });
        })
        .catch(err => toast.error(err.message));
      return;
    }
    
    if (action === "use") {
      window.location.href = `/pahchaan/events/create?templateId=${templateId}`;
      return;
    }

    actionMutation.mutate({ templateId, action });
  }, [workspaceId, queryClient, actionMutation.mutate]);

  const workspaceTemplates: EventTemplate[] = workspaceData?.data?.templates || [];
  const officialTemplates: EventTemplate[] = officialData?.data?.templates || [];
  
  // Calculate stats
  const totalTemplates = workspaceTemplates.length;
  const favoriteTemplates = workspaceTemplates.filter(t => t.favoriteCount > 0).length; // simple approximation for UI
  const totalUses = workspaceTemplates.reduce((acc, t) => acc + (t.usageCount || 0), 0);
  const showGettingStarted = !dismissStarted && totalTemplates === 0 && !isLoadingWorkspace;

  return (
    <div className="flex flex-col gap-8 h-full pb-8">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Template Library</h1>
          <p className="text-muted-foreground mt-1">Reusable blueprints for your events.</p>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger className={buttonVariants({ variant: "default" })}>
            <Plus className="mr-2 h-4 w-4" /> New Template <ChevronDown className="ml-2 h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => toast.info("Create Template not yet implemented")}>
              Create Template
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.info("Save Current Event from an Event Dashboard")}>
              Save Current Event
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              Import Template (Coming Soon)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Statistics Row */}
      <StatisticsRow 
        totalTemplates={totalTemplates}
        officialTemplates={officialTemplates.length}
        favoriteTemplates={favoriteTemplates}
        totalUses={totalUses}
      />

      {/* Getting Started Banner */}
      {showGettingStarted && (
        <GettingStartedCard onDismiss={() => setDismissStarted(true)} />
      )}

      {/* Controls Bar */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-center bg-muted/20 p-2 rounded-xl border border-border/50">
        <div className="flex flex-col sm:flex-row w-full xl:w-auto gap-2 items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name, category or tags..." 
              className="pl-9 h-9 bg-background border-border/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative w-full sm:w-40 shrink-0">
            <Filter className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <select 
              className="flex h-9 w-full items-center justify-between rounded-md border border-border/50 bg-background pl-9 pr-8 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring appearance-none cursor-pointer"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
          <div className="relative w-full sm:w-40 shrink-0">
            <select 
              className="flex h-9 w-full items-center justify-between rounded-md border border-border/50 bg-background pl-3 pr-8 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring appearance-none cursor-pointer"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        <div className="flex gap-1 items-center w-full xl:w-auto justify-end bg-background rounded-lg border border-border/50 p-0.5 shrink-0">
          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setViewMode("grid")} data-active={viewMode === "grid"}>
            <LayoutGrid className={`h-4 w-4 ${viewMode === "grid" ? "text-primary" : "text-muted-foreground"}`} />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setViewMode("list")} data-active={viewMode === "list"}>
            <List className={`h-4 w-4 ${viewMode === "list" ? "text-primary" : "text-muted-foreground"}`} />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="workspace" className="w-full" onValueChange={setTab}>
        <TabsList className="mb-6 bg-muted/30 p-1 border border-border/50">
          <TabsTrigger value="workspace" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Workspace <Badge variant="secondary" className="ml-2 bg-muted h-5 px-1.5 font-normal text-xs">{totalTemplates}</Badge>
          </TabsTrigger>
          <TabsTrigger value="official" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Official <Badge variant="secondary" className="ml-2 bg-muted h-5 px-1.5 font-normal text-xs">{officialTemplates.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="favorites" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Favorites <Badge variant="secondary" className="ml-2 bg-muted h-5 px-1.5 font-normal text-xs">{favoriteTemplates}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workspace" className="m-0 focus-visible:outline-none">
          {isLoadingWorkspace ? (
            <div className="h-64 flex items-center justify-center">
              <LoadingState text="Loading workspace templates..." />
            </div>
          ) : workspaceTemplates.length === 0 ? (
            <EmptyState tab="workspace" />
          ) : (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
              {workspaceTemplates.map((template) => (
                <TemplateCard 
                  key={template._id as string} 
                  template={template} 
                  onAction={handleAction} 
                  isActionPending={actionMutation.isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="official" className="m-0 focus-visible:outline-none">
          {isLoadingOfficial ? (
            <div className="h-64 flex items-center justify-center">
              <LoadingState text="Loading official blueprints..." />
            </div>
          ) : officialTemplates.length === 0 ? (
            <EmptyState tab="official" />
          ) : (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
              {officialTemplates.map((template) => (
                <TemplateCard 
                  key={template._id as string} 
                  template={template} 
                  onAction={handleAction}
                  isActionPending={actionMutation.isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="favorites" className="m-0 focus-visible:outline-none">
          <EmptyState tab="favorites" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ tab }: { tab: string }) {
  if (tab === "official") {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border/50 border-dashed bg-muted/10 p-12 text-center min-h-[400px]">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5 text-primary mb-6 shadow-sm border border-primary/10">
          <LayoutTemplate className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight mb-2">Official Templates</h2>
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          Enterprise blueprints curated by the Pahchaan team.
        </p>
        <Badge variant="secondary" className="px-3 py-1 font-medium bg-background border border-border/50">Coming Soon</Badge>
      </div>
    );
  }

  if (tab === "favorites") {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border/50 border-dashed bg-muted/10 p-12 text-center min-h-[400px]">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 mb-6 shadow-sm border border-amber-500/20">
          <Star className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight mb-2">No Favorites Yet</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Mark templates as favorites to easily access them here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border/50 border-dashed bg-muted/10 p-8 md:p-12 text-center min-h-[500px]">
      <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-background mb-8 shadow-sm border border-border/50">
        <LayoutTemplate className="h-12 w-12 text-primary/80" />
      </div>
      
      <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">No Templates Yet</h2>
      
      <p className="text-sm text-muted-foreground max-w-lg mb-8 leading-relaxed">
        Templates let you save complete event configurations—including branding, registration, QR codes, badges, scanner settings, and notifications—so you can launch future events in seconds.
      </p>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4 mb-10 text-sm font-medium text-muted-foreground text-left max-w-2xl mx-auto">
        <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Branding</div>
        <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Registration</div>
        <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> QR Design</div>
        <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Badge Design</div>
        <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Scanner</div>
        <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Notifications</div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <Button size="lg" className="px-8" onClick={() => toast.info("Create Template not yet implemented")}>
          Create Template
        </Button>
        <Button size="lg" variant="outline" className="px-8 bg-background" onClick={() => toast.info("Go to an event's settings to save it as a template.")}>
          Save Existing Event
        </Button>
      </div>
    </div>
  );
}
