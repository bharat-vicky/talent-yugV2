/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Key, Plus, Trash2, Copy, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Generating state
  const [isGenerating, setIsGenerating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [showPlaintext, setShowPlaintext] = useState<{name: string, key: string} | null>(null);

  // We need the active workspace ID. In a real app we'd get this from a Context or props.
  // We'll fetch it from the layout/session API for demo, or hardcode it since it's a demo.
  // Actually, we can fetch all workspaces and pick the first one since we are using client side.
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  const fetchKeys = useCallback(async (wId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/pahchaan/api/workspaces/${wId}/apikeys`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setKeys(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch workspace ID then load keys
    fetch("/pahchaan/api/workspaces")
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) {
          setWorkspaceId(data[0].id);
          fetchKeys(data[0].id);
        }
      });
  }, [fetchKeys]);

  const generateKey = async () => {
    if (!newKeyName || !workspaceId) return;
    setIsGenerating(true);
    try {
      const res = await fetch(`/pahchaan/api/workspaces/${workspaceId}/apikeys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName })
      });
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);

      // Show the plaintext key
      setShowPlaintext({ name: data.name, key: data.plaintextKey });
      setNewKeyName("");
      fetchKeys(workspaceId);
    } catch (e: unknown) {
      toast.error((e as Error).message || "An error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  const revokeKey = async (keyId: string) => {
    if (!workspaceId) return;
    if (!confirm("Are you sure you want to revoke this key? Applications using it will immediately fail.")) return;
    
    try {
      await fetch(`/pahchaan/api/workspaces/${workspaceId}/apikeys/${keyId}`, { method: "DELETE" });
      toast.success("API Key revoked");
      fetchKeys(workspaceId);
    } catch (e: unknown) {
      toast.error("Failed to revoke key");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (loading) return <div className="p-10 animate-pulse text-gray-500">Loading API Keys...</div>;

  return (
    <div className="max-w-4xl flex flex-col gap-8">
      
      <div className="flex items-center justify-between border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
          <p className="text-muted-foreground mt-1">Manage programmatic access to your workspace.</p>
        </div>
      </div>

      {showPlaintext && (
        <div className="bg-green-950/30 border border-green-900 rounded-xl p-6 relative animate-in fade-in zoom-in-95">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-400">API Key Generated Successfully</h3>
              <p className="text-sm text-green-200/70 mt-1 mb-4">
                Please copy this key and store it somewhere safe. For security reasons, <strong>we cannot show it to you again</strong>.
              </p>
              
              <div className="flex items-center gap-2">
                <code className="bg-black border border-green-900/50 px-4 py-2 rounded-lg font-mono text-sm text-white select-all">
                  {showPlaintext.key}
                </code>
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(showPlaintext.key)}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              
              <Button 
                variant="ghost" 
                className="mt-6 text-green-400 hover:text-green-300 hover:bg-green-900/20"
                onClick={() => setShowPlaintext(null)}
              >
                I have saved my key
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Generate New Key</h3>
        <div className="flex items-end gap-4 max-w-md">
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-sm text-gray-400">Key Name</label>
            <Input 
              value={newKeyName}
              onChange={e => setNewKeyName(e.target.value)}
              placeholder="e.g. Production Scanner App" 
              className="bg-black"
            />
          </div>
          <Button onClick={generateKey} disabled={isGenerating || !newKeyName}>
            <Plus className="w-4 h-4 mr-2" />
            Generate Key
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Active Keys</h3>
        {keys.filter(k => k.status === 'active').length === 0 ? (
          <div className="border border-dashed border-gray-800 rounded-xl p-8 flex flex-col items-center justify-center text-gray-500">
            <Key className="w-8 h-8 mb-3 opacity-50" />
            <p>No active API keys found.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border/50 bg-background overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="p-4 font-medium text-sm text-muted-foreground">Name</th>
                  <th className="p-4 font-medium text-sm text-muted-foreground">Key Prefix</th>
                  <th className="p-4 font-medium text-sm text-muted-foreground">Created</th>
                  <th className="p-4 font-medium text-sm text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {keys.filter(k => k.status === 'active').map((key) => (
                  <tr key={key._id} className="border-b border-border/10 last:border-0 hover:bg-muted/10">
                    <td className="p-4 font-medium">{key.name}</td>
                    <td className="p-4">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {key.prefix}••••••••••••••••••••{key.lastFour}
                      </code>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {format(new Date(key.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="p-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
                        onClick={() => revokeKey(key._id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Revoke
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
    </div>
  );
}
