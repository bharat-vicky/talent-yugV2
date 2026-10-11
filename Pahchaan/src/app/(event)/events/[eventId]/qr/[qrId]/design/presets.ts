import { QRCodeDesignOptions } from "@/domain/types";

export type PresetName = "Default" | "Minimal" | "Modern";

export const QR_PRESETS: Record<PresetName, QRCodeDesignOptions> = {
  Default: {
    margin: 10,
    qrOptions: { errorCorrectionLevel: "Q" },
    dotsOptions: { type: "rounded", color: "#000000" },
    backgroundOptions: { color: "#ffffff" },
    cornersSquareOptions: { type: "extra-rounded", color: "#000000" },
    cornersDotOptions: { type: "dot", color: "#000000" },
  },
  Minimal: {
    margin: 0,
    qrOptions: { errorCorrectionLevel: "L" },
    dotsOptions: { type: "square", color: "#000000" },
    backgroundOptions: { color: "#ffffff" },
    cornersSquareOptions: { type: "square", color: "#000000" },
    cornersDotOptions: { type: "square", color: "#000000" },
  },
  Modern: {
    margin: 10,
    qrOptions: { errorCorrectionLevel: "H" },
    dotsOptions: { type: "classy", color: "#2563EB" },
    backgroundOptions: { color: "#ffffff" },
    cornersSquareOptions: { type: "extra-rounded", color: "#1D4ED8" },
    cornersDotOptions: { type: "dot", color: "#1D4ED8" },
  }
};
