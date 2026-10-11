import {apiSchemas} from "@/lib/api-schemas";
import {z} from "zod";
import {readJson,HttpError,httpError} from "@/lib/http";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eventRepository } from "@/infrastructure/repositories/EventRepository";
import { guestRepository } from "@/infrastructure/repositories/GuestRepository";
import { GuestService } from "@/application/services/GuestService";
import { RBACService } from "@/application/services/RBACService";

// Handle Bulk Imports
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { eventId } = await params;
    const event = await eventRepository.findById(eventId);
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const hasAccess = await RBACService.checkPermission(session.user.id, event.workspaceId, "manager");
    if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = apiSchemas.bulkGuests.parse(await readJson(req, 5242880));
    const { guests } = body;

    if (!Array.isArray(guests)) {
      return NextResponse.json({ error: "Invalid payload format. Expected 'guests' array." }, { status: 400 });
    }

    const result = await GuestService.importGuests(
      event.workspaceId,
      eventId,
      session.user.id,
      guests
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    if (error instanceof HttpError || error instanceof z.ZodError) return httpError(error);
    return NextResponse.json({ error: (error as Error).message || String(error) }, { status: 500 });
  }
}

// Handle Bulk Status Updates
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { eventId } = await params;
    const event = await eventRepository.findById(eventId);
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const hasAccess = await RBACService.checkPermission(session.user.id, event.workspaceId, "manager");
    if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = apiSchemas.bulkGuests.parse(await readJson(req, 5242880));
    const { guestIds, status } = body;

    if (!Array.isArray(guestIds) || !status) {
      return NextResponse.json({ error: "Invalid payload. Expected 'guestIds' array and 'status'." }, { status: 400 });
    }

    let count = 0;
    if (status === "approved") {
      for (const guestId of guestIds) {
        try {
          await GuestService.approveGuest(event.workspaceId, eventId, session.user.id, guestId);
          count++;
        } catch (e) {
          console.error(`Failed to approve guest ${guestId}`, e);
        }
      }
    } else {
      if (!["pending", "rejected", "cancelled", "archived"].includes(status)) {
        return NextResponse.json({ error: "Invalid bulk status" }, { status: 400 });
      }
      count = await guestRepository.updateManyStatus(guestIds, status, event.workspaceId, eventId);
    }

    return NextResponse.json({ success: true, count });
  } catch (error: unknown) {
    if (error instanceof HttpError || error instanceof z.ZodError) return httpError(error);
    return NextResponse.json({ error: (error as Error).message || String(error) }, { status: 500 });
  }
}
