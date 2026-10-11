import {apiSchemas} from "@/lib/api-schemas";
import {z} from "zod";
import {readJson,HttpError,httpError} from "@/lib/http";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eventRepository } from "@/infrastructure/repositories/EventRepository";
import { RBACService } from "@/application/services/RBACService";
import { ScannerService } from "@/application/services/ScannerService";

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

    // Ensure the operator has scanner permission
    const hasAccess = await RBACService.checkPermission(session.user.id, event.workspaceId, "member");
    if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = apiSchemas.scan.parse(await readJson(req));
    const { qrData, guestId, direction, location } = body;

    if (!qrData && !guestId) {
      return NextResponse.json({ error: "Either qrData or guestId must be provided" }, { status: 400 });
    }

    const userAgent = req.headers.get("user-agent") || "";
    let device = "Desktop Scanner";
    if (/iPad|Tablet/i.test(userAgent)) device = "Tablet";
    else if (/iPhone|iPod/i.test(userAgent)) device = "iOS (iPhone)";
    else if (/Android/i.test(userAgent)) device = "Android";
    else if (/Macintosh|Mac OS/i.test(userAgent)) device = "macOS";
    else if (/Windows/i.test(userAgent)) device = "Windows";
    else if (/Linux/i.test(userAgent)) device = "Linux";

    const result = await ScannerService.processScan(
      event.workspaceId,
      eventId,
      session.user.id,
      { qrData, guestId },
      direction || "in",
      location,
      device
    );

    return NextResponse.json(result);
  } catch (error: unknown) {
    if (error instanceof HttpError || error instanceof z.ZodError) return httpError(error);
    return NextResponse.json({ error: (error as Error).message || String(error) }, { status: 500 });
  }
}
