"use client";

import { useMemo, useState } from "react";
import type QRCodeStylingType from "qr-code-styling";
import { QRCodeDesignOptions } from "@/domain/types";
import { QRCanvas } from "./QRCanvas";
import { Button } from "@/components/ui/button";
import { Expand, Shrink, RefreshCcw, Moon, Sun, Grid } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

interface PreviewPanelProps {
  design: QRCodeDesignOptions;
  destination: string;
  qrRef: React.MutableRefObject<QRCodeStylingType | null>;
}

export function PreviewPanel({ design, destination, qrRef }: PreviewPanelProps) {
  const [zoom, setZoom] = useState(1);
  const [bgMode, setBgMode] = useState<"light" | "dark" | "transparent">("transparent");
  const [refreshKey, setRefreshKey] = useState(0);

  const debouncedDesign = useDebounce(design, 200);
  const debouncedDestination = useDebounce(destination, 200);

  const validation = useMemo(() => {
    let contrastScore = 100;
    const bg = design.backgroundOptions?.color || "#ffffff";
    const fg = design.dotsOptions?.color || "#000000";
    if (bg === fg) contrastScore = 0;
    else if (bg === "#000000" && fg === "#ffffff") contrastScore = 80; 

    const logoSize = design.imageOptions?.imageSize || 0;
    const logoScore = logoSize > 0.4 ? "Poor" : logoSize > 0.3 ? "Warning" : "Safe";

    const ec = design.qrOptions?.errorCorrectionLevel || "Q";

    return { 
      contrast: contrastScore > 90 ? "Excellent" : contrastScore > 70 ? "Good" : "Poor",
      logo: logoScore,
      quietZone: (design.margin || 0) >= 10 ? "Pass" : "Warning",
      ec: ec === "H" ? "High" : ec === "Q" ? "Quartile" : ec === "M" ? "Medium" : "Low"
    };
  }, [design]);

  return (
    <div className="flex-1 flex flex-col relative bg-muted/20">
      
      {/* Top Toolbar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between pointer-events-none">
        
        {/* Zoom Controls */}
        <div className="flex gap-2 pointer-events-auto bg-background/80 backdrop-blur rounded-lg p-1 border shadow-sm">
          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}><Shrink className="w-4 h-4" /></Button>
          <div className="flex items-center justify-center w-12 text-xs font-medium">{Math.round(zoom * 100)}%</div>
          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setZoom(z => Math.min(2, z + 0.25))}><Expand className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setRefreshKey(k => k + 1)}><RefreshCcw className="w-3 h-3" /></Button>
        </div>

        {/* Background Toggles */}
        <div className="flex gap-2 pointer-events-auto bg-background/80 backdrop-blur rounded-lg p-1 border shadow-sm">
          <Button variant={bgMode === "light" ? "secondary" : "ghost"} size="icon" className="w-8 h-8" onClick={() => setBgMode("light")}><Sun className="w-4 h-4" /></Button>
          <Button variant={bgMode === "dark" ? "secondary" : "ghost"} size="icon" className="w-8 h-8" onClick={() => setBgMode("dark")}><Moon className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className={cn(
        "flex-1 overflow-auto flex items-center justify-center p-8 transition-colors duration-300",
        bgMode === "light" && "bg-gray-100",
        bgMode === "dark" && "bg-zinc-900",
        bgMode === "transparent" && "bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#374151_1px,transparent_1px)] [background-size:16px_16px]"
      )}>
        <div 
          className={cn(
            "transition-transform duration-200 shadow-xl bg-white flex items-center justify-center border border-border",
            design.shape === "circle" ? "rounded-full overflow-hidden" : "rounded-xl"
          )}
          style={{ transform: `scale(${zoom})` }}
        >
          <QRCanvas options={{ ...debouncedDesign, data: debouncedDestination }} qrRef={qrRef} refreshKey={refreshKey} />
        </div>
      </div>

    </div>
  );
}
