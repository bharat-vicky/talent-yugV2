import {readJson,HttpError,httpError} from "@/lib/http";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { TemplateService } from "@/application/services/TemplateService";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const updateSchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  thumbnail: z.string().nullable().optional(),
  coverImage: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  visibility: z.enum(["private", "workspace", "public"] as const).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json(errorResponse("Unauthorized"), { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const workspaceId = searchParams.get("workspaceId");
    
    if (!workspaceId) {
      return NextResponse.json(errorResponse("workspaceId is required"), { status: 400 });
    }

    const { id } = await params;
    const template = await TemplateService.getTemplateById(session.user.id, workspaceId, id);
    
    return NextResponse.json(successResponse(template));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return NextResponse.json(errorResponse(error.message || "Internal Server Error"), { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json(errorResponse("Unauthorized"), { status: 401 });

    const body = await readJson(req);
    const validated = updateSchema.parse(body);
    const { id } = await params;
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { workspaceId, ...updateData } = validated;
    
    const template = await TemplateService.updateTemplate(
      session.user.id,
      validated.workspaceId,
      id,
      updateData
    );

    return NextResponse.json(successResponse(template, "Template updated successfully"));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(errorResponse("Validation Error", error.errors), { status: 400 });
    }
    return NextResponse.json(errorResponse(error.message || "Internal Server Error"), { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json(errorResponse("Unauthorized"), { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const workspaceId = searchParams.get("workspaceId");
    
    if (!workspaceId) {
      return NextResponse.json(errorResponse("workspaceId is required"), { status: 400 });
    }

    const { id } = await params;
    await TemplateService.deleteTemplate(session.user.id, workspaceId, id);
    
    return NextResponse.json(successResponse(null, "Template deleted successfully"));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return NextResponse.json(errorResponse(error.message || "Internal Server Error"), { status: 500 });
  }
}
