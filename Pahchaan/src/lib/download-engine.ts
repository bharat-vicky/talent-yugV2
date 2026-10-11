import JSZip from "jszip";
import jsPDF from "jspdf";
import QRCodeStyling from "qr-code-styling";
import { QRCodeDocument } from "@/domain/types";

export interface DownloadBatchOptions {
  qrs: QRCodeDocument[]; // Array of QR documents
  format: "pdf_a4" | "pdf_sticker" | "zip";
  pdfLayout?: number; // 8, 20, 24, 28, 30, 32
  imageFormat?: "png" | "jpeg" | "svg";
}

export const BatchDownloadEngine = {
  async generate(options: DownloadBatchOptions) {
    const { qrs, format, pdfLayout = 32, imageFormat = "png" } = options;

    if (qrs.length === 0) throw new Error("No QR codes to download.");

    // 1. Generate Blob for every QR
    const qrBlobs: { name: string; blob: Blob }[] = [];
    
    for (const qr of qrs) {
      // In Bulk, destination URL is encoded directly into design.data or qr.destinationUrl
      const dataUrl = qr.destinationUrl || qr.design.data;
      
      const qrCode = new QRCodeStyling({
        ...qr.design,
        data: dataUrl,
        width: 1000, // High res for print
        height: 1000,
      });

      const blob = await qrCode.getRawData(imageFormat) as Blob;
      if (blob) {
        qrBlobs.push({
          name: `${qr.sequence || qr.shortId}.${imageFormat}`,
          blob
        });
      }
    }

    if (format === "zip") {
      return this.generateZip(qrBlobs);
    } else {
      return this.generatePdf(qrBlobs, format, pdfLayout);
    }
  },

  async generateZip(qrBlobs: { name: string; blob: Blob }[]) {
    const zip = new JSZip();
    
    qrBlobs.forEach(({ name, blob }) => {
      zip.file(name, blob);
    });

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = `Pahchaan_QR_Batch_${new Date().getTime()}.zip`;
    a.click();
    
    URL.revokeObjectURL(url);
  },

  async generatePdf(qrBlobs: { name: string; blob: Blob }[], format: "pdf_a4" | "pdf_sticker", layout: number) {
    // Determine page size
    const isSticker = format === "pdf_sticker";
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: isSticker ? [304.8, 457.2] : "a4" // 12x18 inches = 304.8x457.2 mm
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Calculate grid
    let cols = 4;
    let rows = 8;
    
    if (isSticker) {
      cols = 8;
      rows = 12; // 96 per page
    } else {
      if (layout === 8) { cols = 2; rows = 4; }
      else if (layout === 20) { cols = 4; rows = 5; }
      else if (layout === 24) { cols = 4; rows = 6; }
      else if (layout === 28) { cols = 4; rows = 7; }
      else if (layout === 30) { cols = 5; rows = 6; }
      else if (layout === 32) { cols = 4; rows = 8; }
    }

    const margin = 10;
    const spacing = 5;
    const usableWidth = pageWidth - (margin * 2);
    const usableHeight = pageHeight - (margin * 2);
    
    const cellWidth = (usableWidth - (spacing * (cols - 1))) / cols;
    const cellHeight = (usableHeight - (spacing * (rows - 1))) / rows;
    
    // The QR should be square, so take the min of cellWidth/cellHeight
    const qrSize = Math.min(cellWidth, cellHeight) - 5; // leave room for text

    let currentItem = 0;

    for (let i = 0; i < qrBlobs.length; i++) {
      if (currentItem > 0 && currentItem % (cols * rows) === 0) {
        pdf.addPage();
      }

      const pageIndex = currentItem % (cols * rows);
      const col = pageIndex % cols;
      const row = Math.floor(pageIndex / cols);

      const x = margin + (col * (cellWidth + spacing)) + ((cellWidth - qrSize) / 2);
      const y = margin + (row * (cellHeight + spacing));

      const blobUrl = URL.createObjectURL(qrBlobs[i].blob);
      
      pdf.addImage(blobUrl, "PNG", x, y, qrSize, qrSize);
      URL.revokeObjectURL(blobUrl);

      // Add ID text below QR
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      const text = qrBlobs[i].name.replace(".png", "");
      const textWidth = pdf.getTextWidth(text);
      pdf.text(text, x + (qrSize / 2) - (textWidth / 2), y + qrSize + 4);

      currentItem++;
    }

    pdf.save(`Pahchaan_QR_Batch_${new Date().getTime()}.pdf`);
  }
};
