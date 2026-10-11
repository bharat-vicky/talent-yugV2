import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eventRepository } from "@/infrastructure/repositories/EventRepository";

export async function GET(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId } = await params;
  const event = await eventRepository.findById(eventId);
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  try {
    const client = await (await import("@/infrastructure/db")).default();
    const collection = client.db().collection("qr_codes");

    const qrs = await collection.find({ workspaceId: event.workspaceId, eventId }).toArray();

    // Create CSV content
    const headers = ["ID", "Name", "Status", "Destination URL", "Batch ID", "Created At"];
    const rows = qrs.map(qr => {
      const dataUrl = qr.destinationUrl || qr.design?.data || "";
      return [
        qr.shortId || "",
        `"${(qr.name || "").replace(/"/g, '""')}"`,
        qr.status || "draft",
        `"${dataUrl.replace(/"/g, '""')}"`,
        qr.batchId || "",
        qr.createdAt ? new Date(qr.createdAt).toISOString() : ""
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="Pahchaan_QRs_${event.name.replace(/[^a-z0-9]/gi, '_')}.csv"`,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
