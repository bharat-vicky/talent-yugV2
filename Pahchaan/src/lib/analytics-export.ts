/* eslint-disable @typescript-eslint/no-explicit-any */
import jsPDF from "jspdf";
import * as htmlToImage from "html-to-image";
import { toast } from "sonner";

export interface AnalyticsExportData {
  eventId: string;
  eventName: string;
  eventSlug?: string;
  workspaceName?: string;
  kpis: {
    totalGuests?: number;
    approvedRegistrations?: number;
    checkedInGuests?: number;
    attendanceRate?: number;
    totalScans?: number;
    totalRegistrations?: number;
  };
  timeline?: Array<{
    name: string;
    value: number;
  }>;
}

/**
 * Generates and downloads a clean, professional, multi-section executive PDF report.
 */
export async function exportAnalyticsToPDF(data: AnalyticsExportData) {
  const toastId = toast.loading("Generating PDF Report...");

  try {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4", // 210 x 297 mm
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 14;
    const contentWidth = pageWidth - margin * 2; // 182mm

    // Format numbers
    const totalGuests = data.kpis.totalGuests || 0;
    const approvedGuests = data.kpis.approvedRegistrations || 0;
    const checkedInGuests = data.kpis.checkedInGuests || 0;
    const totalScans = data.kpis.totalScans || 0;
    const attendanceRate = totalGuests > 0 ? ((checkedInGuests / totalGuests) * 100).toFixed(1) : "0.0";
    const approvalRate = totalGuests > 0 ? ((approvedGuests / totalGuests) * 100).toFixed(1) : "0.0";
    const avgScans = checkedInGuests > 0 ? (totalScans / checkedInGuests).toFixed(1) : "0.0";

    const timestamp = new Date().toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    // Pahchaan forest-green report header
    const drawHeader = (isFirstPage: boolean = true) => {
      pdf.setFillColor(24, 75, 63); // Pahchaan forest green
      pdf.rect(0, 0, pageWidth, isFirstPage ? 32 : 18, "F");

      pdf.setFillColor(39, 39, 42); // #27272a
      pdf.rect(0, isFirstPage ? 31.2 : 17.4, pageWidth, 0.8, "F");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(isFirstPage ? 14 : 11);
      pdf.setTextColor(255, 255, 255);
      pdf.text("PAHCHAAN", margin, isFirstPage ? 13 : 11);

      pdf.setFontSize(isFirstPage ? 9 : 8);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(161, 161, 170); // zinc-400
      pdf.text("EVENT ANALYTICS & ATTENDANCE REPORT", margin + (isFirstPage ? 34 : 28), isFirstPage ? 13 : 11);

      if (isFirstPage) {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10.5);
        pdf.setTextColor(255, 255, 255);
        const eventDisplayName = data.eventName || "Event Overview";
        pdf.text(eventDisplayName.toUpperCase(), margin, 24);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(161, 161, 170);
        const metaRight = `Generated: ${timestamp}  |  ID: ${data.eventId.slice(0, 8)}...`;
        pdf.text(metaRight, pageWidth - margin, 24, { align: "right" });
      }
    };

    // Helper to draw the footer
    const drawFooter = (pageNum: number, totalPages: number = 1) => {
      const footerY = pageHeight - 10;
      pdf.setDrawColor(228, 228, 231); // zinc-200
      pdf.setLineWidth(0.3);
      pdf.line(margin, footerY - 2, pageWidth - margin, footerY - 2);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      pdf.setTextColor(113, 113, 122); // zinc-500
      pdf.text("Pahchaan Event Management Platform • Executive Summary", margin, footerY + 3);
      pdf.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, footerY + 3, { align: "right" });
    };

    // 1. Initial Page Header
    drawHeader(true);
    let currentY = 41;

    // ==========================================
    // 2. EXECUTIVE KPI CARDS GRID (3 x 2)
    // ==========================================
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11.5);
    pdf.setTextColor(9, 9, 11);
    pdf.text("Executive KPI Summary", margin, currentY);

    currentY += 5;

    const cards = [
      { label: "Total Guests", value: totalGuests.toLocaleString(), sub: `${approvedGuests} Approved (${approvalRate}%)` },
      { label: "Total Check-ins", value: checkedInGuests.toLocaleString(), sub: `${attendanceRate}% Attendance Rate` },
      { label: "Total QR Scans", value: totalScans.toLocaleString(), sub: "Across all access points" },
      { label: "Attendance Rate", value: `${attendanceRate}%`, sub: `${Math.max(0, totalGuests - checkedInGuests)} Remaining` },
      { label: "Avg Engagement", value: `${avgScans}x`, sub: "Scans per checked-in guest" },
      { label: "Registration Submissions", value: (data.kpis.totalRegistrations || totalGuests).toLocaleString(), sub: "Total Form Records" },
    ];

    const cardCols = 3;
    const cardGap = 4;
    const cardWidth = (contentWidth - (cardCols - 1) * cardGap) / cardCols;
    const cardHeight = 22;

    cards.forEach((card, idx) => {
      const col = idx % cardCols;
      const row = Math.floor(idx / cardCols);
      const x = margin + col * (cardWidth + cardGap);
      const y = currentY + row * (cardHeight + cardGap);

      // Card Background & Border (Monochrome SaaS UI Theme)
      pdf.setFillColor(250, 250, 250); // zinc-50
      pdf.setDrawColor(228, 228, 231); // zinc-200
      pdf.setLineWidth(0.3);
      pdf.roundedRect(x, y, cardWidth, cardHeight, 2, 2, "FD");

      // Top Obsidian accent bar
      pdf.setFillColor(24, 24, 27); // zinc-900
      pdf.rect(x + 2, y, cardWidth - 4, 0.6, "F");

      // Label
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(6.8);
      pdf.setTextColor(113, 113, 122); // zinc-500
      pdf.text(card.label.toUpperCase(), x + 4, y + 5.8);

      // Value
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12.5);
      pdf.setTextColor(9, 9, 11); // zinc-950
      pdf.text(card.value, x + 4, y + 13.5);

      // Subtitle
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6.8);
      pdf.setTextColor(161, 161, 170); // zinc-400
      pdf.text(card.sub, x + 4, y + 18.5);
    });

    currentY += Math.ceil(cards.length / cardCols) * (cardHeight + cardGap) + 7;

    // =======================================================
    // 3. VISUAL ATTENDANCE & PERFORMANCE ANALYTICS SECTION
    // ==========================================
    const timelineData = data.timeline || [];
    const hasTimelineActivity = timelineData.length > 0 && timelineData.some(d => d.value > 0);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11.5);
    pdf.setTextColor(9, 9, 11);
    pdf.text("Visual Attendance & Performance Analytics", margin, currentY);
    currentY += 5;

    if (hasTimelineActivity) {
      // 3A. Real Check-in Activity Chart
      const chartsContainer = document.getElementById("analytics-charts-container");
      if (chartsContainer) {
        try {
          const isDark = document.documentElement.classList.contains("dark");
          const chartDataUrl = await htmlToImage.toPng(chartsContainer, {
            quality: 0.95,
            pixelRatio: 2,
            cacheBust: true,
            skipFonts: true,
            fontEmbedCSS: "",
            backgroundColor: isDark ? "#09090b" : "#ffffff",
            filter: (node) => {
              if (node instanceof HTMLElement) {
                if (node.classList.contains("print:hidden")) return false;
                if (node.getAttribute("role") === "menu") return false;
              }
              return true;
            },
          });

          if (chartDataUrl && chartDataUrl.length > 100) {
            const imgProps = pdf.getImageProperties(chartDataUrl);
            const naturalHeight = (imgProps.height * contentWidth) / imgProps.width;
            const targetHeight = Math.min(Math.max(naturalHeight, 40), 72);

            pdf.setFillColor(255, 255, 255);
            pdf.setDrawColor(228, 228, 231);
            pdf.setLineWidth(0.3);
            pdf.roundedRect(margin, currentY, contentWidth, targetHeight, 2, 2, "FD");

            pdf.addImage(chartDataUrl, "PNG", margin + 1, currentY + 1, contentWidth - 2, targetHeight - 2);
            currentY += targetHeight + 6;
          }
        } catch (err) {
          console.warn("Could not capture chart snapshot:", err);
        }
      }
    } else {
      // 3B. Crisp Native Vector Card when No Check-ins Have Occurred Yet (Monochrome SaaS Theme)
      const statusBoxHeight = 36;
      pdf.setFillColor(250, 250, 250);
      pdf.setDrawColor(228, 228, 231);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(margin, currentY, contentWidth, statusBoxHeight, 2, 2, "FD");

      // Status indicator badge
      pdf.setFillColor(24, 24, 27); // obsidian dark badge
      pdf.roundedRect(margin + 4, currentY + 4, 42, 5.5, 1, 1, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(6.5);
      pdf.setTextColor(255, 255, 255);
      pdf.text("LIVE STREAM CONNECTED", margin + 6, currentY + 7.8);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(9, 9, 11);
      pdf.text("Real-Time Check-In Stream Provisioned", margin + 4, currentY + 16);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      pdf.setTextColor(113, 113, 122);
      pdf.text(
        "Scanner terminals and guest QR codes are provisioned. Live arrival statistics will plot automatically upon first scan.",
        margin + 4,
        currentY + 22
      );

      // Mini metadata badges inside status card
      const miniBadges = [
        { label: "Provisioned Guests", val: `${totalGuests}` },
        { label: "Approved Access Passes", val: `${approvedGuests}` },
        { label: "Gate Check-in Status", val: "0 / 0 Received" },
      ];

      miniBadges.forEach((b, bi) => {
        const bx = margin + 4 + bi * 58;
        const by = currentY + 26;
        pdf.setFillColor(255, 255, 255);
        pdf.setDrawColor(228, 228, 231);
        pdf.roundedRect(bx, by, 54, 7, 1, 1, "FD");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(6.5);
        pdf.setTextColor(113, 113, 122);
        pdf.text(`${b.label}: `, bx + 3, by + 4.8);
        pdf.setTextColor(9, 9, 11);
        pdf.text(b.val, bx + 3 + pdf.getTextWidth(`${b.label}: `), by + 4.8);
      });

      currentY += statusBoxHeight + 7;
    }

    // =======================================================
    // 4. DETAILED ATTENDANCE & REGISTRATION DATA TABLE
    // ==========================================
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11.5);
    pdf.setTextColor(9, 9, 11);
    pdf.text(hasTimelineActivity ? "Attendance Timeline Breakdown" : "Event Attendance & Registration Audit", margin, currentY);
    currentY += 5;

    // Table Header (Obsidian Dark Theme)
    const colWidths = [16, 76, 45, 45];
    const headers = ["#", "Category / Interval", "Metrics / Count", "Verification Status"];

    pdf.setFillColor(24, 24, 27); // #18181b
    pdf.rect(margin, currentY, contentWidth, 7, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.5);
    pdf.setTextColor(255, 255, 255);

    let headerX = margin;
    headers.forEach((h, i) => {
      pdf.text(h, headerX + 3, currentY + 4.8);
      headerX += colWidths[i];
    });

    currentY += 7;

    // Rows
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);

    if (hasTimelineActivity) {
      const rowsToShow = timelineData.slice(0, 8);
      rowsToShow.forEach((row, i) => {
        if (currentY > 275) return;

        if (i % 2 === 1) {
          pdf.setFillColor(250, 250, 250);
          pdf.rect(margin, currentY, contentWidth, 6, "F");
        }

        pdf.setTextColor(24, 24, 27);
        let rowX = margin;

        pdf.text(String(i + 1), rowX + 3, currentY + 4.2);
        rowX += colWidths[0];

        pdf.text(row.name || "N/A", rowX + 3, currentY + 4.2);
        rowX += colWidths[1];

        pdf.setFont("helvetica", "bold");
        pdf.text(`${row.value} check-in${row.value === 1 ? "" : "s"}`, rowX + 3, currentY + 4.2);
        pdf.setFont("helvetica", "normal");
        rowX += colWidths[2];

        pdf.setTextColor(24, 24, 27);
        pdf.text("Verified Check-in", rowX + 3, currentY + 4.2);

        pdf.setDrawColor(244, 244, 245);
        pdf.setLineWidth(0.2);
        pdf.line(margin, currentY + 6, margin + contentWidth, currentY + 6);

        currentY += 6;
      });
    } else {
      // Default Audit Rows
      const auditRows = [
        { label: "Total Registered Guests", metric: `${totalGuests} registered`, status: "Database Synced" },
        { label: "Approved Attendee Passes", metric: `${approvedGuests} approved (${approvalRate}%)`, status: "Access Active" },
        { label: "Checked-in Attendees", metric: `${checkedInGuests} arrived (${attendanceRate}%)`, status: "Awaiting Scans" },
        { label: "Total QR Code Scans", metric: `${totalScans} scans recorded`, status: "Gate Active" },
        { label: "Engagement Ratio", metric: `${avgScans} scans per attendee`, status: "Baseline Normal" },
        { label: "Form Registration Records", metric: `${data.kpis.totalRegistrations || totalGuests} submissions`, status: "Processed" },
      ];

      auditRows.forEach((row, i) => {
        if (currentY > 275) return;

        if (i % 2 === 1) {
          pdf.setFillColor(250, 250, 250);
          pdf.rect(margin, currentY, contentWidth, 6, "F");
        }

        pdf.setTextColor(24, 24, 27);
        let rowX = margin;

        pdf.text(String(i + 1), rowX + 3, currentY + 4.2);
        rowX += colWidths[0];

        pdf.text(row.label, rowX + 3, currentY + 4.2);
        rowX += colWidths[1];

        pdf.setFont("helvetica", "bold");
        pdf.text(row.metric, rowX + 3, currentY + 4.2);
        pdf.setFont("helvetica", "normal");
        rowX += colWidths[2];

        pdf.setTextColor(39, 39, 42); // zinc-800
        pdf.text(row.status, rowX + 3, currentY + 4.2);

        pdf.setDrawColor(244, 244, 245);
        pdf.setLineWidth(0.2);
        pdf.line(margin, currentY + 6, margin + contentWidth, currentY + 6);

        currentY += 6;
      });
    }

    // 5. Draw Footer
    drawFooter(1, 1);

    // Save and download PDF
    const safeName = (data.eventName || "event").toLowerCase().replace(/[^a-z0-9]/g, "_");
    pdf.save(`Pahchaan_Analytics_Report_${safeName}_${Date.now()}.pdf`);

    // Log Notification in background
    logExportNotification(data.eventId, "pdf", data.eventName);

    toast.success("Executive PDF Report downloaded successfully!", { id: toastId });
  } catch (error: any) {
    console.error("Failed to generate PDF report:", error);
    toast.error(`Failed to generate PDF: ${error?.message || error}`, { id: toastId });
  }
}

async function logExportNotification(eventId: string, format: string, eventName: string) {
  if (!eventId) return;
  try {
    await fetch(`/pahchaan/api/events/${eventId}/notifications/activity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "report_exported",
        title: "Analytics Report Exported",
        message: `Executive ${format.toUpperCase()} report was exported for "${eventName || 'Event'}".`,
        details: { format, eventName }
      })
    });
  } catch {
    // Non-blocking
  }
}

/**
 * Generates and downloads a high-resolution, crisp image export (PNG or JPG) of the dashboard.
 */
export async function exportAnalyticsToImage(options: {
  elementId?: string;
  eventName: string;
  eventId: string;
  format: "png" | "jpeg";
  quality?: number;
}) {
  const { elementId = "analytics-dashboard-container", eventName, format, quality = 0.95 } = options;
  const toastId = toast.loading(`Generating ${format.toUpperCase()} Image...`);

  try {
    const element = document.getElementById(elementId);
    if (!element) throw new Error("Dashboard container element not found.");

    // Detect theme background to ensure proper contrast
    const isDark = document.documentElement.classList.contains("dark") || 
                   window.getComputedStyle(element).backgroundColor !== "rgba(0, 0, 0, 0)";
    
    // Choose appropriate background
    const backgroundColor = isDark ? "#09090b" : "#ffffff";

    const config = {
      quality,
      pixelRatio: 2, // Crisp 2x retina resolution
      cacheBust: true,
      skipFonts: true,
      fontEmbedCSS: "",
      backgroundColor,
      filter: (node: HTMLElement) => {
        if (node.classList?.contains("print:hidden")) return false;
        if (node.getAttribute?.("role") === "menu") return false;
        return true;
      },
    };

    let dataUrl = "";
    if (format === "png") {
      dataUrl = await htmlToImage.toPng(element, config);
    } else {
      dataUrl = await htmlToImage.toJpeg(element, config);
    }

    const safeName = (eventName || "event").toLowerCase().replace(/[^a-z0-9]/g, "_");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `Pahchaan_Analytics_${safeName}_${Date.now()}.${format === "jpeg" ? "jpg" : "png"}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Log Notification in background
    logExportNotification(options.eventId, options.format, options.eventName);

    toast.success(`Dashboard image saved as ${options.format.toUpperCase()}!`, { id: toastId });
  } catch (error: any) {
    console.error("Failed to generate image:", error);
    toast.error(`Failed to export image: ${error?.message || error}`, { id: toastId });
  }
}

/**
 * Generates and downloads a CSV export of the analytics KPI and timeline data.
 */
export function exportAnalyticsToCSV(data: AnalyticsExportData) {
  const toastId = toast.loading("Generating CSV Export...");

  try {
    const lines: string[] = [];

    // Header Meta
    lines.push(`"Pahchaan Event Analytics Export"`);
    lines.push(`"Event Name","${(data.eventName || "Event").replace(/"/g, '""')}"`);
    lines.push(`"Event ID","${data.eventId}"`);
    lines.push(`"Export Timestamp","${new Date().toISOString()}"`);
    lines.push("");

    // KPIs Section
    lines.push(`"KPI METRICS"`);
    lines.push(`"Metric","Value"`);
    lines.push(`"Total Registered Guests",${data.kpis.totalGuests || 0}`);
    lines.push(`"Approved Registrations",${data.kpis.approvedRegistrations || 0}`);
    lines.push(`"Checked In Guests",${data.kpis.checkedInGuests || 0}`);
    lines.push(`"Attendance Rate (%)",${data.kpis.attendanceRate || (data.kpis.totalGuests ? ((data.kpis.checkedInGuests || 0) / data.kpis.totalGuests) * 100 : 0)}`);
    lines.push(`"Total QR Scans",${data.kpis.totalScans || 0}`);
    lines.push("");

    // Timeline Section
    if (data.timeline && data.timeline.length > 0) {
      lines.push(`"ATTENDANCE TIMELINE"`);
      lines.push(`"Interval / Timestamp","Check-ins"`);
      data.timeline.forEach((item) => {
        lines.push(`"${(item.name || "").replace(/"/g, '""')}",${item.value || 0}`);
      });
    }

    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(lines.join("\n"));
    const safeName = (data.eventName || "event").toLowerCase().replace(/[^a-z0-9]/g, "_");
    const link = document.createElement("a");
    link.href = csvContent;
    link.download = `Pahchaan_Analytics_Data_${safeName}_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Log Notification in background
    logExportNotification(data.eventId, "csv", data.eventName);

    toast.success("CSV Data downloaded successfully!", { id: toastId });
  } catch (error: any) {
    console.error("Failed to generate CSV:", error);
    toast.error(`Failed to export CSV: ${error?.message || error}`, { id: toastId });
  }
}
