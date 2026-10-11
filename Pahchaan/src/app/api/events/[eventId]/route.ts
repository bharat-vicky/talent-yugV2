import {apiSchemas} from "@/lib/api-schemas";
import {z} from "zod";
import {readJson,HttpError,httpError} from "@/lib/http";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { EventService } from "@/application/services/EventService";
import { successResponse, errorResponse } from "@/lib/api-response";
import { eventRepository } from "@/infrastructure/repositories/EventRepository";
import { RBACService } from "@/application/services/RBACService";



export async function GET(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(errorResponse("Unauthorized"), { status: 401 });
    }

    const { eventId } = await params;
    const event = await eventRepository.findById(eventId);

    if (!event) {
      return NextResponse.json(errorResponse("Event not found"), { status: 404 });
    }

    if (!(await RBACService.checkPermission(session.user.id, event.workspaceId, "viewer"))) {
      return NextResponse.json(errorResponse("Forbidden"), { status: 403 });
    }

    return NextResponse.json(successResponse(event), { status: 200 });
  } catch (error: unknown) {
    if (error instanceof HttpError || error instanceof z.ZodError) return httpError(error);
    return NextResponse.json(errorResponse((error as Error).message || "Internal Server Error"), { status: 400 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(errorResponse("Unauthorized"), { status: 401 });
    }

    const body = apiSchemas.event.parse(await readJson(req));
    const { workspaceId, ...updates } = body;

    if (!workspaceId) {
      return NextResponse.json(errorResponse("workspaceId is required"), { status: 400 });
    }

    const { eventId } = await params;

    if (updates.date) updates.date = new Date(updates.date);
    if (updates.endDate) updates.endDate = new Date(updates.endDate);

    // Direct status updates are handled by /action endpoints usually, but if provided, use updateStatus
    if (updates.status) {
      const result = await EventService.updateStatus(session.user.id, workspaceId, eventId, updates.status);
      return NextResponse.json(successResponse(result, "Event status updated"), { status: 200 });
    }

    const event = await EventService.updateEvent(session.user.id, workspaceId, eventId, updates);
    return NextResponse.json(successResponse(event, "Event updated successfully"), { status: 200 });
  } catch (error: unknown) {
    if (error instanceof HttpError || error instanceof z.ZodError) return httpError(error);
    return NextResponse.json(errorResponse((error as Error).message || "Internal Server Error"), { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(errorResponse("Unauthorized"), { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(errorResponse("Workspace ID is required"), { status: 400 });
    }

    const { eventId } = await params;
    await EventService.deleteEvent(session.user.id, workspaceId, eventId);
    return NextResponse.json(successResponse(null, "Event deleted successfully"), { status: 200 });
  } catch (error: unknown) {
    if (error instanceof HttpError || error instanceof z.ZodError) return httpError(error);
    return NextResponse.json(errorResponse((error as Error).message || "Internal Server Error"), { status: 400 });
  }
}
