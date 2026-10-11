import { QRCodeDesignOptions } from "@/domain/types";

export type ValidationStatus = "excellent" | "good" | "poor";

export interface ValidationIssue {
  field: string;
  message: string;
  recommendation: string;
}

export interface ValidationResult {
  overallScore: number;
  status: ValidationStatus;
  issues: ValidationIssue[];
}

export class QRValidationService {
  static validate(design: QRCodeDesignOptions): ValidationResult {
    const issues: ValidationIssue[] = [];
    let score = 100;

    // 1. Contrast Ratio Check (Simple heuristic based on hex values)
    const bgColor = design.backgroundOptions?.color || "#ffffff";
    const fgColor = design.dotsOptions?.color || "#000000";

    const getLuminance = (hex: string) => {
      // Basic luminance approximation for contrast checking
      if (!hex.startsWith("#")) return 0.5;
      const rgb = parseInt(hex.slice(1), 16);
      const r = (rgb >> 16) & 0xff;
      const g = (rgb >>  8) & 0xff;
      const b = (rgb >>  0) & 0xff;
      // standard luminance formula
      return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    };

    const l1 = getLuminance(bgColor);
    const l2 = getLuminance(fgColor);
    const contrast = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

    if (contrast < 3) {
      score -= 30;
      issues.push({
        field: "Colors",
        message: "Poor contrast ratio.",
        recommendation: "Increase contrast by using a darker dot color or lighter background.",
      });
    } else if (contrast < 4.5) {
      score -= 10;
      issues.push({
        field: "Colors",
        message: "Medium contrast ratio.",
        recommendation: "For optimal scanning across all devices, aim for a contrast ratio of 4.5:1.",
      });
    }

    // 2. Logo Coverage Check
    if (design.imageOptions?.imageSize && design.imageOptions.imageSize > 0.4) {
      score -= 20;
      issues.push({
        field: "Logo",
        message: "Logo covers too much area.",
        recommendation: "Reduce logo size to below 40% of the canvas to avoid blocking vital data modules.",
      });
    }

    // 3. Error Correction Level Check
    const ecLevel = design.qrOptions?.errorCorrectionLevel || "Q";
    if (design.image && (ecLevel === "L" || ecLevel === "M")) {
      score -= 15;
      issues.push({
        field: "Error Correction",
        message: "Low error correction with a center logo.",
        recommendation: "Increase error correction to 'Q' or 'H' when using a logo to ensure scan reliability.",
      });
    }

    // Determine status
    let status: ValidationStatus = "excellent";
    if (score < 60) status = "poor";
    else if (score < 85) status = "good";

    return {
      overallScore: Math.max(0, score),
      status,
      issues,
    };
  }
}
