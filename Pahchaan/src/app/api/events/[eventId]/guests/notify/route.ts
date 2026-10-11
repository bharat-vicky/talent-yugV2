import {apiSchemas} from "@/lib/api-schemas";
import {z} from "zod";
import {readJson,HttpError,httpError} from "@/lib/http";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eventRepository } from "@/infrastructure/repositories/EventRepository";
import { guestRepository } from "@/infrastructure/repositories/GuestRepository";
import { RBACService } from "@/application/services/RBACService";
import { NotificationService } from "@/application/services/NotificationService";
import { GuestService } from "@/application/services/GuestService";
import { badgeAttachment } from "@/lib/badge-attachment";

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

    const body = apiSchemas.notify.parse(await readJson(req, 5242880));
    const { guestIds, attachment, customMessage } = body;

    if (!Array.isArray(guestIds)) {
      return NextResponse.json({ error: "Invalid payload. Expected 'guestIds' array." }, { status: 400 });
    }

    if (attachment) {
      try { badgeAttachment(attachment); }
      catch { throw new HttpError("The badge attachment is invalid. Please generate it again.", 400); }
    }
    if (![process.env.SMTP_HOST, process.env.SMTP_USER, process.env.SMTP_PASS, process.env.SMTP_FROM].every(Boolean)) {
      throw new HttpError("Email delivery is temporarily unavailable. Please contact support.", 503);
    }
    const guests = await Promise.all([...new Set(guestIds)].map(id => guestRepository.findById(id)));
    if (guests.some(guest => !guest || guest.workspaceId !== event.workspaceId || guest.eventId !== eventId)) {
      throw new HttpError("Guest not found for this event.", 404);
    }
    let notifiedCount = 0;
    const failedGuestIds: string[] = [];
    for (let guest of guests) {
      const guestId = String(guest!._id);
      try {
        if (!guest?.email) throw new Error("Guest has no email address");
        if (!guest.qrCodeId) {
          await GuestService.approveGuest(event.workspaceId, eventId, session.user.id, guestId);
          guest = await guestRepository.findById(guestId);
        }
        if (!guest?.qrCodeId) throw new Error("Guest badge unavailable");
        await NotificationService.sendGuestInvitation(event.workspaceId, event, guest, JSON.stringify({guestId}), attachment, customMessage);
        notifiedCount++;
      } catch {
        failedGuestIds.push(guestId);
      }
    }
    return NextResponse.json({
      success: notifiedCount > 0, count: notifiedCount, failedGuestIds,
      ...(failedGuestIds.length ? {error: "Some invitations could not be queued. Check that each guest has a valid email address and try again."} : {}),
    }, {status: notifiedCount > 0 ? 202 : 400});
  } catch (error: unknown) {
    if (error instanceof HttpError || error instanceof z.ZodError) return httpError(error);
    return NextResponse.json({ error: (error as Error).message || String(error) }, { status: 500 });
  }
}
