"use client";

import { QRCodeDesignOptions } from "@/domain/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Settings, Palette, Download, Image as ImageIcon, Box } from "lucide-react";
import { toast } from "sonner";

interface ConfiguratorSidebarProps {
  name: string;
  setName: (v: string) => void;
  destination: string;
  setDestination: (v: string) => void;
  design: QRCodeDesignOptions;
  setDesign: (updater: (prev: QRCodeDesignOptions) => QRCodeDesignOptions) => void;
  isNew: boolean;
  onExport: (format: "png" | "svg" | "jpeg" | "webp" | "pdf") => void;
  generationMode?: "single" | "bulk";
  setGenerationMode?: (mode: "single" | "bulk") => void;
  bulkOptions?: { quantity: number; prefix: string; startNumber: number; padding: number };
  setBulkOptions?: (options: { quantity: number; prefix: string; startNumber: number; padding: number }) => void;
}

const applyImageShape = (base64: string, shape: "square" | "circle" | "diamond" | undefined): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!shape || shape === "square") return resolve(base64);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const size = Math.min(img.width, img.height);
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(base64);

      ctx.clearRect(0, 0, size, size);
      
      ctx.beginPath();
      if (shape === "circle") {
        ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
      } else if (shape === "diamond") {
        ctx.moveTo(size/2, 0);
        ctx.lineTo(size, size/2);
        ctx.lineTo(size/2, size);
        ctx.lineTo(0, size/2);
      }
      ctx.closePath();
      ctx.clip();

      const scale = Math.max(size / img.width, size / img.height);
      const x = (size - img.width * scale) / 2;
      const y = (size - img.height * scale) / 2;
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = base64;
  });
};

export function ConfiguratorSidebar({
  name, setName, destination, setDestination, design, setDesign, isNew, onExport,
  generationMode = "single", setGenerationMode, bulkOptions, setBulkOptions
}: ConfiguratorSidebarProps) {
  
  const updateDesign = (key: keyof QRCodeDesignOptions, value: unknown) => {
    setDesign(d => ({ ...d, [key]: value }));
  };

  const updateNested = (parent: keyof QRCodeDesignOptions, key: string, value: unknown) => {
    setDesign(d => ({
      ...d,
      [parent]: {
        ...(d[parent] as Record<string, unknown>),
        [key]: value
      }
    }));
  };

  return (
    <div className="w-[350px] flex-shrink-0 border-r border-border bg-card flex flex-col h-full shadow-sm z-10 overflow-y-auto">
      <Accordion className="w-full">
        
        {/* General */}
        <AccordionItem value="general" className="border-b-0">
          <AccordionTrigger className="px-4 hover:bg-muted/50 data-[state=open]:bg-muted/20">
            <div className="flex items-center"><Settings className="w-4 h-4 mr-2" /> General</div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-2 space-y-6">
            
            {/* General Subsection */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">General</h4>
              <div className="space-y-2">
                <Label>QR Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Main Entrance" />
              </div>
              <div className="space-y-2">
                <Label>Destination URL</Label>
                <Input value={destination} onChange={e => setDestination(e.target.value)} placeholder="https://..." />
              </div>
            </div>

            {/* Size and Margins */}
            <div className="space-y-4 pt-4 border-t border-border">

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Size (px)</Label>
                  <Input type="number" value={design.width || 500} onChange={e => {
                    const val = parseInt(e.target.value);
                    updateDesign("width", val);
                    updateDesign("height", val);
                  }} />
                </div>
                <div className="space-y-2">
                  <Label>Margin (px)</Label>
                  <Input type="number" value={design.margin || 10} onChange={e => updateDesign("margin", parseInt(e.target.value))} />
                </div>
              </div>
            </div>

          </AccordionContent>
        </AccordionItem>

        {/* Style & Pattern */}
        <AccordionItem value="style" className="border-b-0 border-t">
          <AccordionTrigger className="px-4 hover:bg-muted/50 data-[state=open]:bg-muted/20">
            <div className="flex items-center"><Box className="w-4 h-4 mr-2" /> Style & Pattern</div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-2 space-y-6">
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pattern Shape</Label>
              <div className="grid grid-cols-2 gap-2 bg-muted/50 p-1 rounded-lg">
                <Button 
                  variant={design.shape !== "circle" ? "secondary" : "ghost"} 
                  className="h-8 text-xs shadow-none"
                  onClick={() => updateDesign("shape", "square")}
                >
                  Standard Square
                </Button>
                <Button 
                  variant={design.shape === "circle" ? "secondary" : "ghost"} 
                  className="h-8 text-xs shadow-none"
                  onClick={() => updateDesign("shape", "circle")}
                >
                  Circle Template
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data Pattern</Label>
              <div className="grid grid-cols-3 gap-2">
                {["square", "dots", "rounded", "extra-rounded", "classy", "classy-rounded"].map(type => (
                  <Button 
                    key={type}
                    variant={design.dotsOptions?.type === type ? "default" : "outline"}
                    className="h-10 text-xs capitalize"
                    onClick={() => updateNested("dotsOptions", "type", type)}
                  >
                    {type.replace("-", " ")}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Corner Frame</Label>
              <div className="grid grid-cols-3 gap-2">
                {["square", "dot", "extra-rounded"].map(type => (
                  <Button 
                    key={type}
                    variant={design.cornersSquareOptions?.type === type ? "default" : "outline"}
                    className="h-10 text-xs capitalize"
                    onClick={() => updateNested("cornersSquareOptions", "type", type)}
                  >
                    {type.replace("-", " ")}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Corner Center</Label>
              <div className="grid grid-cols-2 gap-2">
                {["square", "dot"].map(type => (
                  <Button 
                    key={type}
                    variant={design.cornersDotOptions?.type === type ? "default" : "outline"}
                    className="h-10 text-xs capitalize"
                    onClick={() => updateNested("cornersDotOptions", "type", type)}
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Colors */}
        <AccordionItem value="colors" className="border-b-0 border-t">
          <AccordionTrigger className="px-4 hover:bg-muted/50 data-[state=open]:bg-muted/20">
            <div className="flex items-center"><Palette className="w-4 h-4 mr-2" /> Colors</div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-2 space-y-4">
            <div className="space-y-2">
              <Label>Foreground Color</Label>
              <div className="flex gap-2">
                <Input 
                  type="color" 
                  className="w-12 h-10 p-1"
                  value={design.dotsOptions?.color || "#000000"}
                  onChange={e => {
                    updateNested("dotsOptions", "color", e.target.value);
                    updateNested("cornersSquareOptions", "color", e.target.value);
                    updateNested("cornersDotOptions", "color", e.target.value);
                  }}
                />
                <Input 
                  className="flex-1 h-10 uppercase"
                  value={design.dotsOptions?.color || "#000000"}
                  onChange={e => {
                    updateNested("dotsOptions", "color", e.target.value);
                    updateNested("cornersSquareOptions", "color", e.target.value);
                    updateNested("cornersDotOptions", "color", e.target.value);
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Background Color</Label>
              <div className="flex gap-2">
                <Input 
                  type="color" 
                  className="w-12 h-10 p-1"
                  value={design.backgroundOptions?.color || "#ffffff"}
                  onChange={e => updateNested("backgroundOptions", "color", e.target.value)}
                />
                <Input 
                  className="flex-1 h-10 uppercase"
                  value={design.backgroundOptions?.color || "#ffffff"}
                  onChange={e => updateNested("backgroundOptions", "color", e.target.value)}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Logo Branding */}
        <AccordionItem value="logo" className="border-b-0 border-t">
          <AccordionTrigger className="px-4 hover:bg-muted/50 data-[state=open]:bg-muted/20">
            <div className="flex items-center"><ImageIcon className="w-4 h-4 mr-2" /> Logo & Branding</div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-2 space-y-4">
            <div className="space-y-2">
              <Label>Logo Image</Label>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  className="w-full relative overflow-hidden"
                >
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          if (event.target?.result) {
                            const resultStr = event.target.result.toString();
                            setDesign(prev => ({ ...prev, originalImage: resultStr }));
                            const shape = design.imageOptions?.logoShape || "square";
                            applyImageShape(resultStr, shape).then(masked => {
                              updateDesign("image", masked);
                            });
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  {design.image ? "Change Logo" : "Upload Logo"}
                </Button>
                {design.image && (
                  <Button 
                    variant="destructive" 
                    onClick={() => {
                      updateDesign("image", undefined);
                      setDesign(prev => ({ ...prev, originalImage: undefined }));
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Logo Shape</Label>
              <Select 
                value={design.imageOptions?.logoShape || "square"}
                onValueChange={(val) => {
                  const shape = val as "square" | "circle" | "diamond";
                  updateNested("imageOptions", "logoShape", shape);
                  if (design.originalImage) {
                    applyImageShape(design.originalImage, shape).then(masked => {
                      updateDesign("image", masked);
                    });
                  } else if (design.image) {
                     applyImageShape(design.image, shape).then(masked => {
                        updateDesign("image", masked);
                     });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="square">Square</SelectItem>
                  <SelectItem value="circle">Circle</SelectItem>
                  <SelectItem value="diamond">Diamond</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Size (%)</Label>
                <Input 
                  type="number"
                  step="0.1"
                  max="0.5"
                  value={design.imageOptions?.imageSize ?? 0.4}
                  onChange={e => {
                    const val = parseFloat(e.target.value);
                    updateNested("imageOptions", "imageSize", isNaN(val) ? '' : val);
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Padding</Label>
                <Input 
                  type="number"
                  value={design.imageOptions?.margin ?? 0}
                  onChange={e => {
                    const val = parseInt(e.target.value);
                    updateNested("imageOptions", "margin", isNaN(val) ? '' : val);
                  }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <Label className="cursor-pointer" htmlFor="hide-bg">Remove Quiet Zone Behind Logo</Label>
              <Switch 
                id="hide-bg"
                checked={design.imageOptions?.hideBackgroundDots !== false}
                onCheckedChange={c => updateNested("imageOptions", "hideBackgroundDots", c)}
              />
            </div>
          </AccordionContent>
        </AccordionItem>


        {/* Export */}
        <AccordionItem value="export" className="border-b-0 border-t">
          <AccordionTrigger className="px-4 hover:bg-muted/50 data-[state=open]:bg-muted/20">
            <div className="flex items-center"><Download className="w-4 h-4 mr-2" /> Export</div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-2 space-y-6">
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Generation Mode</h4>
              <div className="grid grid-cols-2 gap-2 bg-muted/50 p-1 rounded-lg">
                <Button 
                  variant={generationMode === "single" ? "secondary" : "ghost"} 
                  className="h-8 text-xs shadow-none"
                  onClick={() => setGenerationMode?.("single")}
                >
                  Single QR
                </Button>
                <Button 
                  variant={generationMode === "bulk" ? "secondary" : "ghost"} 
                  className={`h-8 text-xs shadow-none ${generationMode !== "bulk" ? "text-muted-foreground" : ""}`}
                  onClick={() => setGenerationMode?.("bulk")}
                >
                  Bulk Sequential
                </Button>
              </div>

              {generationMode === "bulk" && bulkOptions && setBulkOptions && (
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border">
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input type="number" min={1} max={10000} value={bulkOptions.quantity} onChange={e => setBulkOptions({ ...bulkOptions, quantity: parseInt(e.target.value) || 1 })} />
                  </div>
                  <div className="text-xs text-muted-foreground p-2 bg-muted rounded-md flex items-center justify-center text-center">
                    Generating {bulkOptions.quantity} unique QR codes with random 12-character alphanumeric IDs (e.g. X845AVLMR78V).
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Export Format</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="w-full" onClick={() => onExport("png")}>PNG</Button>
                <Button variant="outline" className="w-full" onClick={() => onExport("svg")}>SVG</Button>
                <Button variant="outline" className="w-full" onClick={() => onExport("jpeg")}>JPEG</Button>
                <Button variant="outline" className="w-full" onClick={() => onExport("webp")}>WEBP</Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

      </Accordion>
    </div>
  );
}
