import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eventRepository } from "@/infrastructure/repositories/EventRepository";
import { qrCodeRepository } from "@/infrastructure/repositories/QRRepositories";
import { RBACService } from "@/application/services/RBACService";

export async function GET(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId } = await params;
  const event = await eventRepository.findById(eventId);
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const hasAccess = await RBACService.checkPermission(session.user.id, event.workspaceId, "viewer");
  if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const client = await (await import("@/infrastructure/db")).default();
    const db = client.db();
    const downloads = await db.collection("qr_downloads")
      .find({ eventId })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();
    
    // Fetch related QR details for context
    const qrIds = [...new Set(downloads.filter(d => d.qrId).map(d => d.qrId))];
    const qrCodes = await Promise.all(qrIds.map(id => qrCodeRepository.findById(id)));
    const qrMap = Object.fromEntries(qrCodes.filter(Boolean).map(qr => [qr!._id!.toString(), qr]));

    const enrichedDownloads = downloads.map(d => {
      let itemName = "Unknown Export";
      if (d.batchId) {
        itemName = `Bulk Batch (${d.batchId.substring(0, 8)}...)`;
      } else if (d.qrId) {
        itemName = qrMap[d.qrId]?.name || "Unknown QR Code";
      }

      return {
        ...d,
        _id: d._id?.toString(),
        itemName,
      };
    });

    return NextResponse.json(enrichedDownloads);
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
