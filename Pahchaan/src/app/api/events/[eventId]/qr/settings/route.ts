import {readJson,HttpError,httpError} from "@/lib/http";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eventRepository } from "@/infrastructure/repositories/EventRepository";
import { RBACService } from "@/application/services/RBACService";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId } = await params;
  const event = await eventRepository.findById(eventId);
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const hasAccess = await RBACService.checkPermission(session.user.id, event.workspaceId, "viewer");
  if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json({
    qrSettings: {
      scanSound: true,
      hapticFeedback: true,
      allowDuplicates: true,
      errorCorrection: "M",
      autoCheckIn: true,
      badgeDpi: 300,
      ...event.qrSettings
    }
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId } = await params;
  const event = await eventRepository.findById(eventId);
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  await RBACService.requirePermission(session.user.id, event.workspaceId, "manager");

  try {
    const settings = await readJson(req);

    // Ensure qrSettings object exists or update it
    const updatedSettings = {
      ...event.qrSettings,
      ...settings
    };

    const client = await (await import("@/infrastructure/db")).default();
    await client.db().collection("events").updateOne(
      { _id: new ObjectId(String(event._id)) },
      { $set: { qrSettings: updatedSettings } }
    );

    return NextResponse.json({ success: true, qrSettings: updatedSettings });
  } catch (err: unknown) {
    if (err instanceof HttpError) return httpError(err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
