/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Webhook, Plus, Trash2, Activity, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isCreating, setIsCreating] = useState(false);
  const [newWebhook, setNewWebhook] = useState({ name: "", endpointUrl: "", events: ["guest.created", "guest.checked_in"] });
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  const fetchWebhooks = useCallback(async (wId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/pahchaan/api/workspaces/${wId}/webhooks`);
      const data = await res.json();
      if (Array.isArray(data)) setWebhooks(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch("/pahchaan/api/workspaces")
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) {
          setWorkspaceId(data[0].id);
          fetchWebhooks(data[0].id);
        }
      });
  }, [fetchWebhooks]);

  const createWebhook = async () => {
    if (!newWebhook.name || !newWebhook.endpointUrl || !workspaceId) return;
    setIsCreating(true);
    try {
      const res = await fetch(`/pahchaan/api/workspaces/${workspaceId}/webhooks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newWebhook)
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setNewWebhook({ name: "", endpointUrl: "", events: ["guest.created", "guest.checked_in"] });
      fetchWebhooks(workspaceId);
      toast.success("Webhook configured successfully");
    } catch (e: unknown) {
      toast.error((e as Error).message || "An error occurred");
    } finally {
      setIsCreating(false);
    }
  };

  const deleteWebhook = async (webhookId: string) => {
    if (!workspaceId) return;
    if (!confirm("Remove this webhook?")) return;
    
    try {
      await fetch(`/pahchaan/api/workspaces/${workspaceId}/webhooks/${webhookId}`, { method: "DELETE" });
      toast.success("Webhook removed");
      fetchWebhooks(workspaceId);
    } catch (e: unknown) {
      toast.error("Failed to remove webhook");
    }
  };

  if (loading) return <div className="p-10 animate-pulse text-gray-500">Loading Webhooks...</div>;

  return (
    <div className="max-w-4xl flex flex-col gap-8">
      
      <div className="flex items-center justify-between border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Webhooks</h1>
          <p className="text-muted-foreground mt-1">Receive real-time HTTP POST payloads to external servers.</p>
        </div>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Add Endpoint</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-400">Description</label>
            <Input 
              value={newWebhook.name}
              onChange={e => setNewWebhook({...newWebhook, name: e.target.value})}
              placeholder="e.g. Zapier Sync" 
              className="bg-black"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-400">Endpoint URL</label>
            <Input 
              value={newWebhook.endpointUrl}
              onChange={e => setNewWebhook({...newWebhook, endpointUrl: e.target.value})}
              placeholder="https://..." 
              className="bg-black"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={createWebhook} disabled={isCreating || !newWebhook.name || !newWebhook.endpointUrl}>
            <Plus className="w-4 h-4 mr-2" />
            Add Webhook
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Configured Endpoints</h3>
        {webhooks.length === 0 ? (
          <div className="border border-dashed border-gray-800 rounded-xl p-8 flex flex-col items-center justify-center text-gray-500">
            <Webhook className="w-8 h-8 mb-3 opacity-50" />
            <p>No webhooks configured.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {webhooks.map((hook) => (
              <div key={hook._id} className="bg-black border border-gray-800 rounded-xl p-6 flex flex-col md:flex-row gap-6 justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold">{hook.name}</h4>
                    {hook.status === 'active' ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-green-950 text-green-400">
                        <Activity className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-red-950 text-red-400">
                        <AlertCircle className="w-3 h-3" /> Failing
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mt-1 font-mono break-all">{hook.endpointUrl}</p>
                  
                  <div className="mt-4 flex flex-wrap gap-2">
                    {hook.events.map((ev: string) => (
                      <span key={ev} className="px-2 py-1 bg-gray-900 border border-gray-800 rounded text-xs text-gray-300">
                        {ev}
                      </span>
                    ))}
                  </div>
                  
                  <div className="mt-4 text-xs text-gray-500">
                    Secret: <code className="bg-gray-900 px-1 py-0.5 rounded ml-1">{hook.secret}</code>
                  </div>
                </div>
                
                <div className="flex flex-col items-end justify-between shrink-0">
                  <div className="text-xs text-gray-500 text-right">
                    <p>Last Delivery: {hook.lastDelivery ? format(new Date(hook.lastDelivery), 'MMM d, h:mm a') : 'Never'}</p>
                    <p className="mt-1">Failures: {hook.failureCount}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
                    onClick={() => deleteWebhook(hook._id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
    </div>
  );
}
