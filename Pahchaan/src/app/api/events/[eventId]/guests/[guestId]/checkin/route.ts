import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eventRepository } from "@/infrastructure/repositories/EventRepository";
import { RBACService } from "@/application/services/RBACService";
import { GuestService } from "@/application/services/GuestService";
import { guestRepository } from "@/infrastructure/repositories/GuestRepository";

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

    const hasAccess = await RBACService.checkPermission(session.user.id, event.workspaceId, "member");
    if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const guest = await guestRepository.findById(guestId);
    if (!guest) return NextResponse.json({ error: "Guest not found" }, { status: 404 });

    const accepted = await GuestService.checkInGuest(event.workspaceId, eventId, session.user.id, guestId, {
      direction: "in",
      method: "manual",
      location: "Dashboard",
      status: "success"
    });
    if (!accepted) return NextResponse.json({ error: "Guest is not eligible for check-in or already checked in" }, { status: 409 });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message || String(error) }, { status: 500 });
  }
}
