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
import { QRService } from "@/application/services/QRService";

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

    let notifiedCount = 0;

    for (const guestId of guestIds) {
      try {
        let guest = await guestRepository.findById(guestId);
        if (!guest) continue;

        // Ensure the guest is approved and has a QR code
        if (guest.status !== "approved" || !guest.qrCodeId) {
          // If not approved, approve them now (this also generates the QR code via GuestService)
          await GuestService.approveGuest(event.workspaceId, eventId, session.user.id, guestId);
          // Refetch to get the updated QR code ID
          const updatedGuest = await guestRepository.findById(guestId);
          if (updatedGuest) guest = updatedGuest;
        }

        if (guest.qrCodeId) {
          // Send notification
          const qrDataString = JSON.stringify({ guestId: guest._id });
          await NotificationService.sendGuestInvitation(
            event.workspaceId,
            event,
            guest,
            qrDataString,
            attachment,
            customMessage
          );
          notifiedCount++;
        }
      } catch (e) {
        console.error(`Failed to notify guest ${guestId}`, e);
      }
    }

    return NextResponse.json({ success: true, count: notifiedCount });
  } catch (error: unknown) {
    if (error instanceof HttpError || error instanceof z.ZodError) return httpError(error);
    return NextResponse.json({ error: (error as Error).message || String(error) }, { status: 500 });
  }
}
