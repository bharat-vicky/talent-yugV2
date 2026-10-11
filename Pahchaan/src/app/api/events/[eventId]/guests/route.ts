import {readJson,HttpError,httpError} from "@/lib/http";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eventRepository } from "@/infrastructure/repositories/EventRepository";
import { guestRepository } from "@/infrastructure/repositories/GuestRepository";
import { GuestService } from "@/application/services/GuestService";
import { RBACService } from "@/application/services/RBACService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { eventId } = await params;
    const event = await eventRepository.findById(eventId);
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const hasAccess = await RBACService.checkPermission(session.user.id, event.workspaceId, "viewer");
    if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const searchParams = req.nextUrl.searchParams;
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "50");
    if (!Number.isSafeInteger(page) || page < 1 || page > 100000 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) throw new HttpError("Invalid pagination. Use a positive page and a limit from 1 to 100.", 400);
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;
    const groupId = searchParams.get("groupId") || undefined;

    const skip = (page - 1) * limit;

    const result = await guestRepository.findByEventId(eventId, {
      skip,
      limit,
      status,
      search,
      groupId
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      meta: {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit)
      }
    });
  } catch (error: unknown) {
    if (error instanceof HttpError) return httpError(error);
    return NextResponse.json({ error: (error as Error).message || String(error) }, { status: 500 });
  }
}

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

    const body = await readJson(req);

    const guest = await GuestService.createGuest(
      event.workspaceId,
      eventId,
      session.user.id,
      body
    );

    return NextResponse.json({ success: true, data: guest });
  } catch (error: unknown) {
    if (error instanceof HttpError) return httpError(error);
    return NextResponse.json({ error: (error as Error).message || String(error) }, { status: 500 });
  }
}
