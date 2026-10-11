import {apiSchemas} from "@/lib/api-schemas";
import {z} from "zod";
import {readJson,HttpError,httpError} from "@/lib/http";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eventRepository } from "@/infrastructure/repositories/EventRepository";
import { QRService, GetQROptions } from "@/application/services/QRService";
import { EventNotificationService } from "@/application/services/EventNotificationService";

export async function GET(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId } = await params;
  const event = await eventRepository.findById(eventId);
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const searchParams = req.nextUrl.searchParams;
  const options: GetQROptions = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    status: searchParams.get("status") as any || undefined,
    search: searchParams.get("search") || undefined,
    category: searchParams.get("category") || undefined,
    page: parseInt(searchParams.get("page") || "1", 10),
    limit: parseInt(searchParams.get("limit") || "20", 10),
    sortBy: searchParams.get("sortBy") || "createdAt",
    sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
  };

  try {
    const result = await QRService.getQRCodes(session.user.id, event.workspaceId, eventId, options);
    return NextResponse.json(result);
  } catch (err: unknown) {
    if (err instanceof HttpError || err instanceof z.ZodError) return httpError(err);
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId } = await params;
  const event = await eventRepository.findById(eventId);
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  try {
    const body = apiSchemas.qr.parse(await readJson(req));
    const qr = await QRService.createQR(
      session.user.id,
      event.workspaceId,
      eventId,
      body.name,
      body.design || {},
      body.isDynamic ?? true,
      body.destinationUrl,
      body.description,
      body.category
    );

    // Trigger Notification
    await EventNotificationService.createNotification({
      eventId,
      workspaceId: event.workspaceId,
      type: "qr_generated",
      title: "QR Code Created",
      message: `Created custom QR Code "${body.name || 'Untitled QR'}".`,
      details: {
        qrId: qr._id,
        name: body.name,
      },
    });

    return NextResponse.json(qr, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof HttpError || err instanceof z.ZodError) return httpError(err);
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
