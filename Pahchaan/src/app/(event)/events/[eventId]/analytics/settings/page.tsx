"use client";

import { use, useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AnalyticsSettingsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    autoRefresh: true,
    refreshInterval: 30,
    timeZone: "UTC",
    currency: "USD"
  });

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      toast.success("Analytics settings saved");
      setSaving(false);
    }, 500);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      
      <div className="flex items-center justify-between border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Analytics Settings</h1>
          <p className="text-gray-400">Configure dashboard preferences and data retention.</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save Changes
        </Button>
      </div>

      <div className="space-y-10">
        
        {/* Dashboard Preferences */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Dashboard Preferences</h2>
          <div className="space-y-4 bg-gray-900/50 p-6 rounded-xl border border-gray-800">
            <label className="flex items-center space-x-4">
              <input 
                type="checkbox"
                checked={settings.autoRefresh}
                onChange={(e) => setSettings({ ...settings, autoRefresh: e.target.checked })}
                className="rounded bg-black border-gray-700 text-white"
              />
              <div>
                <span className="block text-sm font-medium text-white">Auto-Refresh Dashboards</span>
                <span className="block text-xs text-gray-400">Automatically fetch new data without reloading.</span>
              </div>
            </label>

            <div className="pt-4">
              <label className="text-sm font-medium text-gray-300 block mb-2">Refresh Interval (Seconds)</label>
              <select 
                value={settings.refreshInterval}
                onChange={(e) => setSettings({ ...settings, refreshInterval: parseInt(e.target.value) })}
                className="w-full bg-black border-gray-800 text-white rounded-md p-2"
                disabled={!settings.autoRefresh}
              >
                <option value={10}>10 Seconds (Aggressive)</option>
                <option value={30}>30 Seconds (Recommended)</option>
                <option value={60}>1 Minute</option>
                <option value={300}>5 Minutes</option>
              </select>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
