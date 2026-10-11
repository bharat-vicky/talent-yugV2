import {readJson,HttpError,httpError} from "@/lib/http";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

export const dynamic = "force-dynamic";
import { authOptions } from "@/lib/auth";
import { WorkspaceService } from "@/application/services/WorkspaceService";
import { successResponse, errorResponse } from "@/lib/api-response";
import { z } from "zod";

const workspaceSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters").regex(/^[a-z0-9-._/]+$/, "Slug can only contain lowercase letters, numbers, hyphens, underscores, dots, and slashes"),
  timezone: z.string().min(1, "Timezone is required"),
  logo: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(errorResponse("Unauthorized"), { status: 401 });
    }

    const body = await readJson(req);
    const validated = workspaceSchema.parse(body);

    const workspace = await WorkspaceService.createWorkspace(
      session.user.id,
      validated.name,
      validated.slug,
      validated.timezone,
      validated.logo
    );

    return NextResponse.json(successResponse(workspace, "Workspace created successfully"), { status: 201 });
  } catch (error: unknown) {
    if (error instanceof HttpError) return httpError(error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(errorResponse("Validation Error", error.errors), { status: 400 });
    }
    return NextResponse.json(errorResponse((error as Error).message || "Internal Server Error"), { status: 400 });
  }
}

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(errorResponse("Unauthorized"), { status: 401 });
    }

    const { membershipRepository } = await import("@/infrastructure/repositories/MembershipRepository");
    const { workspaceRepository } = await import("@/infrastructure/repositories/WorkspaceRepository");

    const memberships = await membershipRepository.findByUserId(session.user.id);
    
    const workspaces = [];
    for (const m of memberships) {
      const w = await workspaceRepository.findById(m.workspaceId);
      // The frontend expects { id, name }
      if (w) workspaces.push({ id: w._id, name: w.name, slug: w.slug });
    }

    return NextResponse.json(workspaces);
  } catch (error: unknown) {
    if (error instanceof HttpError) return httpError(error);
    return NextResponse.json({ error: (error as Error).message || String(error) }, { status: 500 });
  }
}
