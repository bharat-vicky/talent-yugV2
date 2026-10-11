"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface DownloadOptionsModalProps {
  onClose: () => void;
  onDownload: (options: Omit<import("@/lib/download-engine").DownloadBatchOptions, "qrs"> & {filter: string;shapeFilter: string}) => void;
  isDownloading: boolean;
}

export function DownloadOptionsModal({ onClose, onDownload, isDownloading }: DownloadOptionsModalProps) {
  const [format, setFormat] = useState<"pdf_a4" | "pdf_sticker" | "zip">("pdf_a4");
  const [filter, setFilter] = useState("all");
  const [shapeFilter, setShapeFilter] = useState("all");
  const [pdfLayout, setPdfLayout] = useState(32);
  const [imageFormat, setImageFormat] = useState<"png" | "jpeg" | "svg">("png");

  const pdfLayoutOptions = [8, 20, 24, 28, 30, 32];

  const handleDownload = () => {
    onDownload({ format, filter, shapeFilter, pdfLayout, imageFormat });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-background border border-border shadow-lg w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 rounded-xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/50">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Download Options</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground hover:text-foreground hover:bg-muted">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-8">
          
          <div className="space-y-8">
            {/* Format Column */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">1. FORMAT</Label>
              <div className="space-y-2">
                <Button 
                  variant={format === "pdf_a4" ? "default" : "outline"} 
                  onClick={() => setFormat("pdf_a4")}
                  className="w-full justify-start h-10"
                >
                  A4 PDF Document
                </Button>
                <Button 
                  variant={format === "pdf_sticker" ? "default" : "outline"} 
                  onClick={() => setFormat("pdf_sticker")}
                  className="w-full justify-start h-10"
                >
                  Large Sticker Sheet
                </Button>
                <Button 
                  variant={format === "zip" ? "default" : "outline"}
                  onClick={() => setFormat("zip")}
                  className="w-full justify-start h-10"
                >
                  ZIP Archive
                </Button>
              </div>
            </div>
          </div>

          {/* PDF Layout */}
          {format.startsWith("pdf") && (
            <div className="space-y-3 pt-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">2. PDF LAYOUT (PER PAGE)</Label>
              <div className="grid grid-cols-3 gap-2">
                {pdfLayoutOptions.map((layout) => (
                  <Button
                    key={layout}
                    variant={pdfLayout === layout && format !== "pdf_sticker" ? "default" : "outline"}
                    onClick={() => setPdfLayout(layout)}
                    disabled={format === "pdf_sticker"} // Sticker layout usually has fixed per-page
                    className={`h-9 ${format === "pdf_sticker" ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {layout}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* ZIP Image Format */}
          {format === "zip" && (
            <div className="space-y-3 pt-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">2. IMAGE FORMAT</Label>
              <Select value={imageFormat} onValueChange={(v) => { if(v === "png" || v === "jpeg" || v === "svg")setImageFormat(v); }}>
                <SelectTrigger className="w-full bg-background border-input h-10 text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground">
                  <SelectItem value="png">PNG Format</SelectItem>
                  <SelectItem value="jpeg">JPEG Format</SelectItem>
                  <SelectItem value="svg">SVG Format</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 pt-2">
          <Button 
            className="w-full h-12 text-md font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></span>
                Generating...
              </span>
            ) : format === "zip" ? (
              "Generate & Download ZIP"
            ) : (
              "Generate & Download PDF"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
