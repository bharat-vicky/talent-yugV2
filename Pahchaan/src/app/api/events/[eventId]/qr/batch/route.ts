import {apiSchemas} from "@/lib/api-schemas";
import {z} from "zod";
import {readJson,HttpError,httpError} from "@/lib/http";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eventRepository } from "@/infrastructure/repositories/EventRepository";
import { RBACService } from "@/application/services/RBACService";
import { BulkGenerationService } from "@/application/services/BulkGenerationService";
import { EventNotificationService } from "@/application/services/EventNotificationService";

export async function POST(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId } = await params;
  const event = await eventRepository.findById(eventId);
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  try {
    const body = apiSchemas.batch.parse(await readJson(req, 5242880));
    const { name, design, options, destinationUrlBase } = body;

    if (!options?.quantity || options.quantity < 1) {
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
    }

    const result = await BulkGenerationService.generateSequentialBatch(
      session.user.id,
      event.workspaceId,
      eventId,
      name || "Bulk QR",
      design || {},
      options,
      destinationUrlBase
    );

    // Trigger Notification
    await EventNotificationService.createNotification({
      eventId,
      workspaceId: event.workspaceId,
      type: "qr_generated",
      title: "QR Batch Generated",
      message: `Generated a batch of ${result.quantity} customized QR codes (${name || "Bulk Batch"}).`,
      details: {
        batchId: result.batchId,
        quantity: result.quantity,
        name: name || "Bulk Batch",
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof HttpError || err instanceof z.ZodError) return httpError(err);
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId } = await params;
  const event = await eventRepository.findById(eventId);
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  if (!await RBACService.checkPermission(session.user.id, event.workspaceId, "viewer")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const searchParams = req.nextUrl.searchParams;
  const batchId = searchParams.get("batchId");

  if (!batchId) return NextResponse.json({ error: "Missing batchId" }, { status: 400 });

  const client = await (await import("@/infrastructure/db")).default();
  const collection = client.db().collection("qr_codes");

  const qrs = await collection.find({ workspaceId: event.workspaceId, eventId, batchId }).sort({ sequence: 1 }).toArray();

  return NextResponse.json({
    batchId,
    quantity: qrs.length,
    qrs: qrs.map(q => ({ ...q, _id: q._id.toString() }))
  });
}
