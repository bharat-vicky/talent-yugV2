/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { RBACService } from "@/application/services/RBACService";
import { eventRepository } from "@/infrastructure/repositories/EventRepository";
import { AnalyticsService } from "@/application/services/AnalyticsService";
import { guestRepository } from "@/infrastructure/repositories/GuestRepository";
import { registrationSubmissionRepository } from "@/infrastructure/repositories/RegistrationSubmissionRepository";
import { qrCodeRepository } from "@/infrastructure/repositories/QRRepositories";
import getMongoClient from "@/infrastructure/db";

function toCSV(rows: Array<Record<string, any>>, headers?: string[]): string {
  if (rows.length === 0) return "";
  const cols = headers || Object.keys(rows[0]);
  
  const escapeCell = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = typeof val === "object" ? JSON.stringify(val) : String(val);
    return `"${str.replace(/"/g, '""')}"`;
  };

  const headerLine = cols.map(c => `"${c.replace(/"/g, '""')}"`).join(",");
  const dataLines = rows.map(r => cols.map(c => escapeCell(r[c])).join(","));

  return [headerLine, ...dataLines].join("\r\n");
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { eventId } = await params;
    const event = await eventRepository.findById(eventId);
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const hasAccess = await RBACService.checkPermission(session.user.id, event.workspaceId, "viewer");
    if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get("type") || "executive";
    const format = (searchParams.get("format") || "csv").toLowerCase();

    let exportData: any = null;
    let filename = `${type}_export_${eventId}`;

    if (type === "attendance") {
      const { data: guests } = await guestRepository.findByEventId(eventId, { limit: 10000 });
      exportData = guests.map(g => ({
        "Guest ID": g._id?.toString(),
        "First Name": g.firstName,
        "Last Name": g.lastName || "",
        "Email": g.email || "",
        "Organization": g.organization || "",
        "Title": g.title || "",
        "Status": g.status,
        "Checked In": g.checkIns && g.checkIns.length > 0 ? "YES" : "NO",
        "Total Check-ins": g.checkIns?.length || 0,
        "Last Check-in Time": g.checkIns?.[g.checkIns.length - 1]?.timestamp || "N/A",
        "QR Code ID": g.qrCodeId || "N/A",
        "Created At": g.createdAt ? new Date(g.createdAt).toISOString() : ""
      }));
      filename = `Attendance_Roster_${event.name.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}`;

    } else if (type === "registration") {
      const submissions = await registrationSubmissionRepository.findByEventId(eventId);
      exportData = submissions.map(s => ({
        "Submission ID": s._id?.toString(),
        "Status": s.status,
        "Submitted At": s.submittedAt ? new Date(s.submittedAt).toISOString() : "",
        "Reviewed At": s.reviewedAt ? new Date(s.reviewedAt).toISOString() : "N/A",
        "Reviewed By": s.reviewedBy || "N/A",
        "Answers JSON": JSON.stringify(s.answers || {})
      }));
      filename = `Registration_Data_${event.name.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}`;

    } else if (type === "qr") {
      const qrs = await qrCodeRepository.findMany({ eventId });
      exportData = qrs.map(q => ({
        "QR ID": q._id?.toString(),
        "Short ID": q.shortId || "",
        "Name": q.name || "QR Code",
        "Status": q.status,
        "Scan Count": q.scanCount || 0,
        "Created At": q.createdAt ? new Date(q.createdAt).toISOString() : ""
      }));
      filename = `QR_Scan_Logs_${event.name.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}`;

    } else if (type === "scanner") {
      const client = await getMongoClient();
      const db = client.db();
      const logs = await db.collection("audit_logs")
        .find({ "details.eventId": eventId })
        .sort({ timestamp: -1 })
        .limit(5000)
        .toArray();

      exportData = logs.map(l => ({
        "Log ID": l._id?.toString(),
        "Timestamp": l.timestamp ? new Date(l.timestamp).toISOString() : "",
        "Action": l.action,
        "User ID": l.userId || "System",
        "Details": JSON.stringify(l.details || {})
      }));
      filename = `Scanner_Operations_${event.name.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}`;

    } else {
      // Default: Executive Summary
      const kpis = await AnalyticsService.getEventKPIs(eventId);
      const timeline = await AnalyticsService.getAttendanceTimeline(eventId);
      
      if (format === "csv") {
        const rows = [
          { "Metric": "Event Name", "Value": event.name },
          { "Metric": "Event ID", "Value": eventId },
          { "Metric": "Total Registered Guests", "Value": kpis.totalGuests },
          { "Metric": "Approved Registrations", "Value": kpis.approvedRegistrations },
          { "Metric": "Checked In Guests", "Value": kpis.checkedInGuests },
          { "Metric": "Attendance Rate (%)", "Value": `${kpis.attendanceRate.toFixed(1)}%` },
          { "Metric": "Total QR Scans", "Value": kpis.totalScans }
        ];

        timeline.forEach(t => {
          rows.push({ "Metric": `Check-ins at ${t.name}`, "Value": String(t.value) });
        });

        exportData = rows;
      } else {
        exportData = { kpis, timeline, event: { id: event._id, name: event.name } };
      }
      filename = `Executive_Summary_${event.name.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}`;
    }

    // Trigger Event Notification
    const { EventNotificationService } = await import("@/application/services/EventNotificationService");
    await EventNotificationService.createNotification({
      eventId,
      workspaceId: event.workspaceId,
      type: "report_exported",
      title: "Analytics Report Exported",
      message: `Exported ${format.toUpperCase()} dataset for ${type} report.`,
      details: { format, type, filename },
    });

    if (format === "json") {
      return NextResponse.json(exportData, {
        headers: {
          "Content-Disposition": `attachment; filename="${filename}.json"`,
          "Content-Type": "application/json"
        }
      });
    }

    // Return CSV
    const csvString = Array.isArray(exportData) ? toCSV(exportData) : JSON.stringify(exportData);
    return new NextResponse(csvString, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${filename}.csv"`,
        "Content-Type": "text/csv; charset=utf-8"
      }
    });

  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message || String(error) }, { status: 500 });
  }
}
