import {readJson,HttpError,httpError} from "@/lib/http";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { TemplateService } from "@/application/services/TemplateService";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";
import { TemplateSearchOptions } from "@/infrastructure/repositories/EventTemplateRepository";
import { TemplateModule, TemplateVisibility } from "@/domain/types";

const createSchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  category: z.string(),
  thumbnail: z.string().nullable().optional(),
  coverImage: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  visibility: z.enum(["private", "workspace", "public"] as const).optional(),
  modules: z.array(z.enum([
    "event_settings", "branding", "registration_form", 
    "registration_settings", "qr_config", "scanner_config", 
    "guest_config", "notification_config", "badge_config"
  ] as const)).optional()
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json(errorResponse("Unauthorized"), { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const workspaceId = searchParams.get("workspaceId");
    
    if (!workspaceId) {
      return NextResponse.json(errorResponse("workspaceId is required"), { status: 400 });
    }

    const options: TemplateSearchOptions = {
      workspaceId,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "12"),
      search: searchParams.get("search") || undefined,
      category: searchParams.get("category") || undefined,
      isOfficial: searchParams.has("isOfficial") ? searchParams.get("isOfficial") === "true" : undefined,
      status: searchParams.get("status") || "published",
      visibility: searchParams.get("visibility") || undefined,
    };

    const result = await TemplateService.searchTemplates(session.user.id, workspaceId, options);
    return NextResponse.json(successResponse(result));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return NextResponse.json(errorResponse(error.message || "Internal Server Error"), { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json(errorResponse("Unauthorized"), { status: 401 });

    const body = await readJson(req);
    const validated = createSchema.parse(body);

    const template = await TemplateService.createTemplate(
      session.user.id,
      validated.workspaceId,
      {
        name: validated.name,
        description: validated.description,
        category: validated.category,
        thumbnail: validated.thumbnail,
        coverImage: validated.coverImage,
        tags: validated.tags,
        visibility: validated.visibility as TemplateVisibility,
        modules: validated.modules as TemplateModule[],
      }
    );

    return NextResponse.json(successResponse(template, "Template created successfully"), { status: 201 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(errorResponse("Validation Error", error.errors), { status: 400 });
    }
    return NextResponse.json(errorResponse(error.message || "Internal Server Error"), { status: 500 });
  }
}
