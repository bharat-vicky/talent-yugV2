"use client";

import { use, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useEvent } from "@/providers/event-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QRCodeDocument, QRCodeDesignOptions } from "@/domain/types";
import { Download, Search, Check, Clock, X } from "lucide-react";
import { DownloadOptionsModal } from "./components/DownloadOptionsModal";
import { QRCanvas } from "../../[qrId]/design/components/QRCanvas";
import { BatchDownloadEngine } from "@/lib/download-engine";

export default function BatchGalleryPage({ params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = use(params);
  const { event } = useEvent();
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: batch, isLoading } = useQuery({
    queryKey: ["qr-batch", event._id, batchId],
    queryFn: async () => {
      const res = await fetch(`/pahchaan/api/events/${event._id}/qr/batch?batchId=${batchId}`);
      if (!res.ok) throw new Error("Failed to load batch");
      return res.json();
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-120px)] w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center">
          <Clock className="h-10 w-10 text-muted-foreground animate-pulse mb-4" />
          <h2 className="text-xl font-medium">Loading Batch Data...</h2>
        </div>
      </div>
    );
  }

  if (!batch || !batch.qrs) {
    return <div className="p-8 text-center text-red-500">Failed to load batch.</div>;
  }

  let filteredQRs = [...batch.qrs];
  if (search) {
    filteredQRs = filteredQRs.filter((qr: QRCodeDocument & {_id:string}) => qr.name.toLowerCase().includes(search.toLowerCase()) || qr.shortId.toLowerCase().includes(search.toLowerCase()));
  }
  if (statusFilter !== "all") {
    filteredQRs = filteredQRs.filter((qr: QRCodeDocument & {_id:string}) => qr.status === statusFilter);
  }
  if (sortOrder === "newest") {
    filteredQRs = filteredQRs.sort((a: QRCodeDocument, b: QRCodeDocument) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else {
    filteredQRs = filteredQRs.sort((a: QRCodeDocument, b: QRCodeDocument) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  return (
    <div className="flex flex-col w-full bg-card text-foreground rounded-xl border border-border shadow-sm">
      
      {/* Header */}
      <div className="px-8 py-10 border-b border-border/50">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Generated Codes ({batch.quantity})</h1>
            <p className="text-muted-foreground mt-2">Managing your batch.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search serial..." 
                className="w-[200px] pl-9 bg-background border-input text-sm h-10 placeholder:text-muted-foreground"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            

            <Button 
              variant="outline" 
              className="bg-background hover:bg-muted border-input text-foreground"
              onClick={() => setShowDownloadModal(true)}
            >
              <Download className="w-4 h-4 mr-2" /> Download
            </Button>
          </div>
        </div>
      </div>

      {showDownloadModal && (
        <DownloadOptionsModal 
          onClose={() => setShowDownloadModal(false)}
          onDownload={async (options) => {
            setIsDownloading(true);
            try {
              let toDownload = batch.qrs;
              if (options.filter === "published") {
                toDownload = toDownload.filter((q: QRCodeDocument) => q.status === "published");
              }
              
              await BatchDownloadEngine.generate({
                qrs: toDownload,
                format: options.format,
                pdfLayout: options.pdfLayout,
                imageFormat: options.imageFormat
              });
            
              // Fire and forget logging
              fetch(`/pahchaan/api/events/${event._id}/qr/batch/${batchId}/downloads`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ format: options.format })
              }).catch(console.error);

              setShowDownloadModal(false);
            } catch (err: unknown) {
              console.error(err);
              alert(err instanceof Error ? err.message : "Failed to download");
            } finally {
              setIsDownloading(false);
            }
          }}
          isDownloading={isDownloading}
        />
      )}

      {/* Grid */}
      <div className="flex-1 p-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {filteredQRs.map((qr: QRCodeDocument & {_id:string}) => (
            <div key={qr._id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-colors flex flex-col group shadow-sm">
              <div className="aspect-square bg-white p-4 flex items-center justify-center relative overflow-hidden">
                <div className="w-full h-full flex items-center justify-center relative z-10 pointer-events-none [&>div]:!min-w-0 [&>div]:!min-h-0 [&>div]:!w-full [&>div]:!h-full [&_svg]:!w-full [&_svg]:!h-auto [&_svg]:!max-w-full [&_svg]:!max-h-full [&_canvas]:!w-full [&_canvas]:!h-auto [&_canvas]:!max-w-full [&_canvas]:!max-h-full">
                  <QRCanvas options={qr.design} qrRef={{ current: null }} />
                </div>
              </div>
              <div className="p-3 text-center flex flex-col justify-center flex-1 bg-muted/50 group-hover:bg-muted transition-colors border-t border-border/50">
                <p className="text-[11px] font-mono font-medium text-muted-foreground tracking-wider">
                  {qr.sequence || qr.shortId.toUpperCase()}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        {filteredQRs.length === 0 && (
          <div className="text-center py-20 text-slate-500">
            No QR codes found matching your criteria.
          </div>
        )}
      </div>
      
    </div>
  );
}
