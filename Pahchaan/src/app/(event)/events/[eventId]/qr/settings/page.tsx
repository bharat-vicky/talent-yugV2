"use client";

import { useEvent } from "@/providers/event-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

export default function QRSettingsPage() {
  const { event } = useEvent();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [clearing, setClearing] = useState(false);

  const handleClearAnalytics = async () => {
    if (!confirm("Are you sure you want to permanently clear all scan analytics, time-series charts, and reset all attendee check-ins for this event? This action is irreversible.")) return;
    
    setClearing(true);
    try {
      const res = await fetch(`/pahchaan/api/events/${event._id}/qr/analytics`, {
        method: "DELETE"
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to clear analytics");
      }
      toast.success("All analytics, scan history, and check-in records have been reset.");
      
      // Invalidate all related caches
      queryClient.invalidateQueries({ queryKey: ["qr-kpis"] });
      queryClient.invalidateQueries({ queryKey: ["qr-timeseries"] });
      queryClient.invalidateQueries({ queryKey: ["qr-recent"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["guests"] });
      
      router.refresh();
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">QR Studio Settings</h1>
        <p className="text-muted-foreground mt-1">Manage data retention and advanced settings.</p>
      </div>

      <div className="space-y-6">
        {/* Danger Zone */}
        <Card className="border-destructive/30 shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Danger Zone
            </CardTitle>
            <CardDescription>Irreversible actions for your QR Studio analytics and scan history.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 border border-destructive/20 rounded-xl bg-destructive/5">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-foreground">Delete all analytics data</p>
                  <p className="text-xs text-muted-foreground">Permanently wipe all scan history, device breakdown, check-in records, and reset all analytics back to 0.</p>
                </div>
                <Button variant="destructive" onClick={handleClearAnalytics} disabled={clearing} className="shrink-0 font-semibold shadow-xs">
                  {clearing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {clearing ? "Wiping Data..." : "Clear Analytics"}
                </Button>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
