"use client";

import { useEvent } from "@/providers/event-provider";
import { Download, Image as ImageIcon, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { use } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function QRDownloadsPage({
  params
}: {
  params: Promise<{ eventId: string; qrId: string }>;
}) {
  const { event } = useEvent();
  const { qrId } = use(params);
  const router = useRouter();

  const handleDownload = (format: string) => {
    // In a real app, this would fetch the generated QR code blob from the server
    // For now, we redirect to the Design Studio where the qr-code-styling instance lives
    toast.success(`Preparing ${format} download...`);
    setTimeout(() => {
      router.push(`/events/${event._id}/qr/${qrId}/design`);
    }, 1000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Downloads Center</h1>
          <p className="text-muted-foreground mt-2">
            Download your QR code in various high-resolution formats suitable for print and digital distribution.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Formats */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight">Digital Formats</h2>
            <div className="grid gap-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 text-primary rounded-lg">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">PNG Image</h3>
                    <p className="text-xs text-muted-foreground">Best for web and social media</p>
                  </div>
                </div>
                <Button onClick={() => handleDownload('PNG')}><Download className="h-4 w-4 mr-2" /> Download</Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 text-primary rounded-lg">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">JPEG Image</h3>
                    <p className="text-xs text-muted-foreground">Small file size, no transparency</p>
                  </div>
                </div>
                <Button variant="outline" onClick={() => handleDownload('JPEG')}><Download className="h-4 w-4 mr-2" /> Download</Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 text-primary rounded-lg">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">WEBP Image</h3>
                    <p className="text-xs text-muted-foreground">Modern web format</p>
                  </div>
                </div>
                <Button variant="outline" onClick={() => handleDownload('WEBP')}><Download className="h-4 w-4 mr-2" /> Download</Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight">Print Formats</h2>
            <div className="grid gap-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card border-primary/20 bg-primary/5">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary text-primary-foreground rounded-lg">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">SVG Vector</h3>
                    <p className="text-xs text-muted-foreground">Infinite scaling, best for designers</p>
                  </div>
                </div>
                <Button onClick={() => handleDownload('SVG')}><Download className="h-4 w-4 mr-2" /> Download</Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 text-primary rounded-lg">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">PDF Document</h3>
                    <p className="text-xs text-muted-foreground">Ready to print directly</p>
                  </div>
                </div>
                <Button variant="outline" onClick={() => handleDownload('PDF')}><Download className="h-4 w-4 mr-2" /> Download</Button>
              </div>
            </div>

            <div className="mt-8 p-4 rounded-xl border border-border bg-muted/50 flex items-start gap-4">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Design Adjustments</h4>
                <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  To adjust the resolution, colors, or logo of your QR Code, please open the <button onClick={() => router.push(`/events/${event._id}/qr/${qrId}/design`)} className="text-primary hover:underline font-medium">Design Studio</button>. The Design Studio allows you to preview and download in real-time.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
