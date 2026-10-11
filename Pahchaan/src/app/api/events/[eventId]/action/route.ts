import {readJson,HttpError,httpError} from "@/lib/http";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { EventService } from "@/application/services/EventService";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const actionSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
  action: z.enum(["duplicate", "archive", "publish", "restore", "favorite", "unfavorite"]),
  // Optional payload for duplicate
  payload: z.object({
    name: z.string(),
    slug: z.string(),
    date: z.string()
  }).optional()
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(errorResponse("Unauthorized"), { status: 401 });
    }

    const body = await readJson(req);
    const validated = actionSchema.parse(body);

    const userId = session.user.id;
    const { workspaceId, action, payload } = validated;
    const { eventId } = await params;

    let result;

    switch (action) {
      case "duplicate":
        if (!payload) throw new Error("Payload (name, slug, date) is required to duplicate");
        result = await EventService.duplicateEvent(userId, workspaceId, eventId, payload.name, payload.slug, new Date(payload.date));
        break;
      case "archive":
        result = await EventService.updateStatus(userId, workspaceId, eventId, "archived");
        break;
      case "publish":
        result = await EventService.updateStatus(userId, workspaceId, eventId, "published");
        break;
      case "restore":
        result = await EventService.updateStatus(userId, workspaceId, eventId, "draft"); // restoring puts it back in draft
        break;
      case "favorite":
        result = await EventService.favoriteEvent(userId, workspaceId, eventId);
        break;
      case "unfavorite":
        result = await EventService.unfavoriteEvent(userId, workspaceId, eventId);
        break;
      default:
        throw new Error("Invalid action");
    }

    return NextResponse.json(successResponse(result, `Event ${action} successful`), { status: 200 });
  } catch (error: unknown) {
    if (error instanceof HttpError) return httpError(error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(errorResponse("Validation Error", error.errors), { status: 400 });
    }
    return NextResponse.json(errorResponse((error as Error).message || "Internal Server Error"), { status: 400 });
  }
}
