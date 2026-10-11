"use client";

import { Button } from "@/components/ui/button";
import { QRCodeDesignOptions } from "@/domain/types";
import { PresetName, QR_PRESETS } from "../presets";
import { Wand2 } from "lucide-react";

interface PresetsToolbarProps {
  onSelectPreset: (preset: QRCodeDesignOptions) => void;
  activePreset?: string;
}

export function PresetsToolbar({ onSelectPreset, activePreset }: PresetsToolbarProps) {
  return (
    <div className="flex items-center space-x-2 px-4 py-2 border-b border-border bg-card overflow-x-auto no-scrollbar">
      <div className="flex items-center text-sm font-medium text-muted-foreground mr-2">
        <Wand2 className="w-4 h-4 mr-2" /> Presets
      </div>
      {Object.entries(QR_PRESETS).map(([name, preset]) => (
        <Button
          key={name}
          variant={activePreset === name ? "secondary" : "ghost"}
          size="sm"
          className="text-xs rounded-full px-4"
          onClick={() => onSelectPreset(preset)}
        >
          {name}
        </Button>
      ))}
    </div>
  );
}
