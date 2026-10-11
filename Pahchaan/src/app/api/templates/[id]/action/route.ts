import {readJson,HttpError,httpError} from "@/lib/http";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { TemplateService } from "@/application/services/TemplateService";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const actionSchema = z.object({
  workspaceId: z.string().min(1),
  action: z.enum(["duplicate", "archive", "restore", "favorite", "save-event-as-template", "use"]),
  payload: z.any().optional(), // Specifics depend on the action
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json(errorResponse("Unauthorized"), { status: 401 });

    const body = await readJson(req);
    const validated = actionSchema.parse(body);

    const userId = session.user.id;
    const { workspaceId, action, payload } = validated;
    const { id } = await params;

    let result;

    switch (action) {
      case "save-event-as-template":
        // In this case, `id` in the URL actually refers to `eventId`
        if (!payload || !payload.modules || !payload.templateData) {
          throw new Error("Payload with modules and templateData is required");
        }
        result = await TemplateService.saveEventAsTemplate(
          userId,
          workspaceId,
          id,
          payload.modules,
          payload.templateData
        );
        break;

      case "use":
        if (!payload || !payload.eventData) {
          throw new Error("Payload with eventData is required");
        }
        result = await TemplateService.createEventFromTemplate(
          userId,
          workspaceId,
          id, // id is templateId
          payload.eventData
        );
        break;

      case "duplicate":
        result = await TemplateService.duplicateTemplate(userId, workspaceId, id);
        break;

      case "archive":
        result = await TemplateService.archiveTemplate(userId, workspaceId, id);
        break;

      case "restore":
        result = await TemplateService.restoreTemplate(userId, workspaceId, id);
        break;

      case "favorite":
        result = await TemplateService.favoriteTemplate(userId, workspaceId, id);
        break;

      default:
        throw new Error("Invalid action");
    }

    return NextResponse.json(successResponse(result, `Template ${action} successful`), { status: 200 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(errorResponse("Validation Error", error.errors), { status: 400 });
    }
    return NextResponse.json(errorResponse(error.message || "Internal Server Error"), { status: 400 });
  }
}
