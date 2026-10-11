import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eventRepository } from "@/infrastructure/repositories/EventRepository";
import { RBACService } from "@/application/services/RBACService";
import { guestRepository } from "@/infrastructure/repositories/GuestRepository";
import { QRService } from "@/application/services/QRService";

export async function POST(
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

    const guest = await guestRepository.findById(guestId);
    if (!guest || guest.eventId !== eventId) return NextResponse.json({ error: "Guest not found" }, { status: 404 });

    if (guest.qrCodeId) {
      return NextResponse.json({ error: "Guest already has a QR code" }, { status: 400 });
    }

    const qrData = JSON.stringify({ guestId: guest._id });
    const qrCode = await QRService.createQR(session.user.id, event.workspaceId, eventId, `Badge: ${guest.firstName} ${guest.lastName}`, {
      data: qrData
    });

    await guestRepository.update(guestId, { qrCodeId: qrCode._id as string, updatedAt: new Date() });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message || String(error) }, { status: 500 });
  }
}
