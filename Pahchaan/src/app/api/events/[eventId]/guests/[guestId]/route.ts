import {readJson,HttpError,httpError} from "@/lib/http";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eventRepository } from "@/infrastructure/repositories/EventRepository";
import { guestRepository } from "@/infrastructure/repositories/GuestRepository";
import { RBACService } from "@/application/services/RBACService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string; guestId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { eventId, guestId } = await params;
    const event = await eventRepository.findById(eventId);
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const hasAccess = await RBACService.checkPermission(session.user.id, event.workspaceId, "viewer");
    if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const guest = await guestRepository.findById(guestId);
    if (!guest || guest.eventId !== eventId) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: guest });
  } catch (error: unknown) {
    if (error instanceof HttpError) return httpError(error);
    return NextResponse.json({ error: (error as Error).message || String(error) }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string; guestId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { eventId, guestId } = await params;
    const event = await eventRepository.findById(eventId);
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const hasAccess = await RBACService.checkPermission(session.user.id, event.workspaceId, "manager");
    if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await readJson(req);
    const guest = await guestRepository.findById(guestId);
    if (!guest || guest.eventId !== eventId || guest.workspaceId !== event.workspaceId) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }
    const editable = new Set(["firstName", "lastName", "email", "phone", "organization", "title", "customData", "tags", "groupIds", "notes"]);
    const updates = Object.fromEntries(Object.entries(body).filter(([key]) => editable.has(key)));
    await guestRepository.update(guestId, updates);
    
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof HttpError) return httpError(error);
    return NextResponse.json({ error: (error as Error).message || String(error) }, { status: 500 });
  }
}
