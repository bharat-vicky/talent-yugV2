import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eventRepository } from "@/infrastructure/repositories/EventRepository";
import { RBACService } from "@/application/services/RBACService";
import getMongoClient from "@/infrastructure/db";
import { ObjectId } from "mongodb";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { eventId } = await params;
    const event = await eventRepository.findById(eventId);
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    await RBACService.requirePermission(session.user.id, event.workspaceId, "admin");

    const client = await getMongoClient();
    const db = client.db();

    // Find all QR codes for this event to clear their analytics
    const qrCodes = await db.collection("qr_codes").find({ eventId }).toArray();
    const qrIds = qrCodes.map(q => q._id.toString());

    // 1. Delete all time-series scan data for this event
    await db.collection("qr_scans").deleteMany({ eventId });

    // 2. Delete all download logs for this event
    await db.collection("qr_downloads").deleteMany({ eventId });

    // 3. Clear aggregate analytics for these QR codes and event
    if (qrIds.length > 0) {
      await db.collection("qr_analytics").deleteMany({ qrId: { $in: qrIds } });
    }
    await db.collection("qr_analytics").deleteMany({ eventId });

    // 4. Reset scan counts on the QR codes themselves
    await db.collection("qr_codes").updateMany(
      { eventId },
      { $set: { scanCount: 0, updatedAt: new Date() } }
    );

    // 5. Reset all guest check-ins and reset checked_in status to approved
    await db.collection("guests").updateMany(
      { eventId },
      { 
        $set: { 
          checkIns: [],
          status: "approved",
          updatedAt: new Date() 
        } 
      }
    );

    return NextResponse.json({ success: true, message: "All analytics and check-in records have been reset." });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
