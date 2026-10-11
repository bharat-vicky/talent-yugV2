import { jsPDF } from "jspdf";
import JSZip from "jszip";
import QRCodeStyling from "qr-code-styling";

export type ExportFormat = "png" | "svg" | "jpeg" | "webp" | "pdf";

export interface ExportOptions {
  name: string;
  format: ExportFormat;
  resolution?: number;
}

export class QRExportService {
  /**
   * Generates a data URI or blob for a single QR code.
   * For client-side downloads (PNG, SVG, JPEG, WEBP), it uses qr-code-styling directly.
   * For PDF, it generates a client-side PDF document.
   */
  static async exportSingleQR(
    qrStylingInstance: QRCodeStyling,
    options: ExportOptions
  ): Promise<void> {
    if (options.format === "pdf") {
      // PDF Export
      const extension = "png";
      const blob = await qrStylingInstance.getRawData(extension);
      if (!blob) throw new Error("Failed to generate QR image for PDF");
      
      const imageUrl = URL.createObjectURL(blob as Blob);
      
      // A4 dimensions in mm: 210 x 297
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      doc.setFontSize(22);
      doc.text(options.name, 105, 30, { align: "center" });

      // Add image centered
      // 210 width, 100 image width => x = (210-100)/2 = 55
      doc.addImage(imageUrl, "PNG", 55, 50, 100, 100);

      doc.save(`${options.name.replace(/\s+/g, '_')}.pdf`);
      URL.revokeObjectURL(imageUrl);
    } else {
      // Standard image exports
      await qrStylingInstance.download({
        name: options.name,
        extension: options.format
      });
    }
  }

  /**
   * Batch exports multiple QR codes as a ZIP file.
   * Works on the client side assuming qrStyling instances can be rendered.
   */
  static async exportBatch(
    items: Array<{ name: string; qrStylingInstance: QRCodeStyling }>,
    format: "png" | "svg" | "jpeg" | "webp",
    zipName: string
  ): Promise<void> {
    const zip = new JSZip();

    for (const item of items) {
      const blob = await item.qrStylingInstance.getRawData(format);
      if (blob) {
        zip.file(`${item.name.replace(/\s+/g, '_')}.${format}`, blob);
      }
    }

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `${zipName}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
