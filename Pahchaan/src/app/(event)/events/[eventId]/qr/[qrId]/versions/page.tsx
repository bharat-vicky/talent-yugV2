"use client";

import { use, useState } from "react";
import { useEvent } from "@/providers/event-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, ArrowLeftCircle, CheckCircle2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { QRVersion } from "@/domain/types";

export default function QRVersionsPage({ params }: { params: Promise<{ qrId: string }> }) {
  const { qrId } = use(params);
  const { event } = useEvent();
  const queryClient = useQueryClient();

  const { data: versions, isLoading } = useQuery<QRVersion[]>({
    queryKey: ["qr-versions", event._id, qrId],
    queryFn: async () => {
      const res = await fetch(`/pahchaan/api/events/${event._id}/qr/${qrId}/versions`);
      if (!res.ok) throw new Error("Failed to fetch versions");
      return res.json();
    }
  });

  const restoreMutation = useMutation({
    mutationFn: async (versionId: string) => {
      const res = await fetch(`/pahchaan/api/events/${event._id}/qr/${qrId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore", versionId })
      });
      if (!res.ok) throw new Error("Failed to restore version");
    },
    onSuccess: () => {
      toast.success("Version Restored");
      queryClient.invalidateQueries({ queryKey: ["qr-versions", event._id, qrId] });
      queryClient.invalidateQueries({ queryKey: ["qr", event._id, qrId] });
    },
    onError: (err: unknown) => {
      toast.error("Failed to restore", { description: (err as Error).message || "An error occurred" });
    }
  });

  if (isLoading) return <div className="p-8">Loading versions...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Version History</h1>
        <p className="text-muted-foreground mt-1">View past designs and rollback changes.</p>
      </div>

      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
        {versions?.map((version, index) => (
          <div key={version._id as string} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-border bg-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
              <History className="w-4 h-4 text-muted-foreground" />
            </div>
            
            <Card className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] shadow-sm">
              <CardHeader className="py-4 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{version.changeSummary || "Version Update"}</CardTitle>
                    <CardDescription>{format(new Date(version.createdAt), "PPpp")}</CardDescription>
                  </div>
                  {index === 0 && (
                    <span className="flex items-center text-xs font-medium text-green-600 bg-green-500/10 px-2 py-1 rounded-full">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Current
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="py-4">
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" size="sm">
                    Preview
                  </Button>
                  {index !== 0 && (
                    <Button 
                      size="sm" 
                      onClick={() => restoreMutation.mutate(version._id as string)}
                      disabled={restoreMutation.isPending}
                    >
                      <ArrowLeftCircle className="w-4 h-4 mr-2" /> Restore
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}

        {versions?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No version history available for this QR code yet.
          </div>
        )}
      </div>
    </div>
  );
}
