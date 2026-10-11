/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { use, useState, useEffect } from "react";
import { Download, FileText, CheckCircle2, FileCode, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEvent } from "@/providers/event-provider";
import { exportAnalyticsToPDF } from "@/lib/analytics-export";
import { toast } from "sonner";

export default function ReportsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);

  let eventContext: any = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    eventContext = useEvent();
  } catch {
    eventContext = null;
  }
  const eventName = eventContext?.event?.name || "Event Analytics";

  const [kpis, setKpis] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch(`/pahchaan/api/events/${eventId}/analytics/kpi`).then(r => r.json()),
      fetch(`/pahchaan/api/events/${eventId}/analytics/timeline`).then(r => r.json())
    ]).then(([kpiData, timeData]) => {
      setKpis(kpiData);
      setTimeline(Array.isArray(timeData) ? timeData : []);
    }).catch(err => console.error("Could not preload analytics for PDF:", err));
  }, [eventId]);

  const handleExport = (type: string, format: "csv" | "json" = "csv") => {
    toast.loading(`Downloading ${format.toUpperCase()} report...`, { id: "export-toast", duration: 1500 });
    window.open(`/pahchaan/api/events/${eventId}/analytics/export?type=${type}&format=${format}`, "_self");
  };

  const handleExportExecutivePDF = async () => {
    await exportAnalyticsToPDF({
      eventId,
      eventName,
      eventSlug: eventContext?.event?.slug,
      kpis: kpis || {},
      timeline: timeline || [],
    });
  };

  const reports = [
    { title: "Executive Summary", description: "High-level overview of registration and attendance KPIs with charts.", type: "executive", hasPdf: true },
    { title: "Attendance Roster", description: "Complete list of guests, check-in timestamps, and ticket statuses.", type: "attendance" },
    { title: "Registration Data", description: "Raw export of all form submissions and custom fields.", type: "registration" },
    { title: "QR Scan Logs", description: "Detailed timestamp log of every QR interaction and scan count.", type: "qr" },
    { title: "Scanner Operations", description: "Operator efficiency and offline sync activity audit logs.", type: "scanner" }
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Reports & Exports</h1>
        <p className="text-gray-400">Download raw data, attendee rosters, and executive summaries in PDF, CSV, and JSON.</p>
      </div>

      <div className="space-y-4">
        {reports.map((report) => (
          <div key={report.type} className="bg-card border border-border/60 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="mt-1 p-2.5 bg-muted rounded-lg border border-border/40">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{report.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                <div className="flex items-center gap-2 mt-3 text-xs text-emerald-500 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Instant export ready
                </div>
              </div>
            </div>
            
            <div className="shrink-0 flex flex-wrap md:flex-col md:items-end gap-2">
              {report.hasPdf && (
                <Button onClick={handleExportExecutivePDF} size="sm" className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-medium">
                  <Printer className="w-4 h-4 mr-2" /> Download PDF
                </Button>
              )}
              <Button onClick={() => handleExport(report.type, "csv")} variant="outline" size="sm" className="w-full md:w-auto">
                <Download className="w-4 h-4 mr-2" /> Download CSV
              </Button>
              <Button onClick={() => handleExport(report.type, "json")} variant="ghost" size="sm" className="w-full md:w-auto text-muted-foreground hover:text-foreground">
                <FileCode className="w-4 h-4 mr-2" /> Download JSON
              </Button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
