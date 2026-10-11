import {readJson,HttpError,httpError} from "@/lib/http";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eventRepository } from "@/infrastructure/repositories/EventRepository";
import { RBACService } from "@/application/services/RBACService";

import { ObjectId } from "mongodb";
import { AuditService } from "@/application/services/AuditService";

export async function POST(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId } = await params;
  const event = await eventRepository.findById(eventId);
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  await RBACService.requirePermission(session.user.id, event.workspaceId, "manager");

  try {
    const { action, qrIds } = await readJson(req, 5242880);

    if (!Array.isArray(qrIds) || qrIds.length === 0) {
      return NextResponse.json({ error: "Invalid QR IDs provided" }, { status: 400 });
    }

    const client = await (await import("@/infrastructure/db")).default();
    const db = client.db();

    // Convert string IDs to ObjectIds for MongoDB where necessary, but our repository uses string ID interface mostly
    // We'll use bulk operations directly on the collection for efficiency.
    const objectIds = qrIds.map((id: string) => {
      try {
        return new ObjectId(id);
      } catch {
        return id;
      }
    });

    if (action === "delete") {
      await db.collection("qr_codes").deleteMany({ _id: { $in: objectIds as unknown as ObjectId[] }, workspaceId: event.workspaceId, eventId });
      await AuditService.log(session.user.id, "QR_BULK_DELETED", { count: qrIds.length }, event.workspaceId);
    } else if (action === "archive") {
      await db.collection("qr_codes").updateMany(
        { _id: { $in: objectIds as unknown as ObjectId[] }, workspaceId: event.workspaceId, eventId },
        { $set: { status: "archived", updatedAt: new Date() } }
      );
      await AuditService.log(session.user.id, "QR_BULK_ARCHIVED", { count: qrIds.length }, event.workspaceId);
    } else if (action === "restore") {
      await db.collection("qr_codes").updateMany(
        { _id: { $in: objectIds as unknown as ObjectId[] }, workspaceId: event.workspaceId, eventId },
        { $set: { status: "draft", updatedAt: new Date() } }
      );
      await AuditService.log(session.user.id, "QR_BULK_RESTORED", { count: qrIds.length }, event.workspaceId);
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (err instanceof HttpError) return httpError(err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
