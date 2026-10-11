"use client";

import { useEvent } from "@/providers/event-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QRLibraryTable } from "@/components/qr/QRLibraryTable";
import { toast } from "sonner";

export default function QRLibraryPage() {
  const { event } = useEvent();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;

  const { data, isLoading } = useQuery({
    queryKey: ["qrs", event._id, page, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) params.append("search", search);
      
      const res = await fetch(`/pahchaan/api/events/${event._id}/qr?${params}`);
      if (!res.ok) throw new Error("Failed to fetch QR codes");
      return res.json();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (qrId: string) => {
      const res = await fetch(`/pahchaan/api/events/${event._id}/qr/${qrId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      toast.success("QR Code deleted");
      queryClient.invalidateQueries({ queryKey: ["qrs", event._id] });
    },
    onError: () => toast.error("Failed to delete QR Code")
  });

  const duplicateMutation = useMutation({
    mutationFn: async (qrId: string) => {
      const res = await fetch(`/pahchaan/api/events/${event._id}/qr/${qrId}/duplicate`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to duplicate");
    },
    onSuccess: () => {
      toast.success("QR Code duplicated");
      queryClient.invalidateQueries({ queryKey: ["qrs", event._id] });
    },
    onError: () => toast.error("Failed to duplicate QR Code")
  });

  return (
    <div className="p-8 flex flex-col space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">QR Library</h1>
          <p className="text-muted-foreground mt-1">Manage all QR codes, versions, and templates.</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => window.location.href = `/pahchaan/api/events/${event._id}/qr/export`}>
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
          <Link href={`/events/${event._id}/qr/new/design`}>
            <Button><Plus className="w-4 h-4 mr-2" /> Create QR Code</Button>
          </Link>
        </div>
      </div>

      <Card className="flex-1 flex flex-col min-h-0 border-border/50 shadow-sm">
        <CardHeader className="py-4 shrink-0 border-b border-border/50">
          <CardTitle className="text-lg">All QR Codes</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto p-4">
          <QRLibraryTable
            eventId={event._id as string}
            data={data?.qrs || []}
            total={data?.total || 0}
            page={page}
            limit={limit}
            isLoading={isLoading}
            onPageChange={setPage}
            onSearch={(q) => { setSearch(q); setPage(1); }}
            onDelete={(id) => deleteMutation.mutate(id as string)}
            onDuplicate={(id) => duplicateMutation.mutate(id as string)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
