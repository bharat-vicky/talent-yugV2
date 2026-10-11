import {readJson,HttpError,httpError} from "@/lib/http";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { inviteRepository } from "@/infrastructure/repositories/InviteRepository";
import { WorkspaceService } from "@/application/services/WorkspaceService";
import { RBACService } from "@/application/services/RBACService";
import { z } from "zod";

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["owner", "admin", "manager", "member", "viewer"]),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: workspaceId } = await params;
    
    // Must be at least a manager to see pending invites
    const hasAccess = await RBACService.checkPermission(session.user.id, workspaceId, "manager");
    if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const pendingInvites = await inviteRepository.findPendingByWorkspaceId(workspaceId);
    
    // Sort by most recent
    pendingInvites.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(pendingInvites);
  } catch (error: unknown) {
    if (error instanceof HttpError) return httpError(error);
    return NextResponse.json({ error: (error as Error).message || String(error) }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: workspaceId } = await params;

    // Must be at least an admin to invite members
    const hasAccess = await RBACService.checkPermission(session.user.id, workspaceId, "admin");
    if (!hasAccess) return NextResponse.json({ error: "Forbidden. Must be an admin to invite." }, { status: 403 });

    const body = await readJson(req);
    const validated = inviteSchema.parse(body);

    const invite = await WorkspaceService.inviteMember(
      workspaceId,
      validated.email,
      validated.role,
      session.user.id
    );

    return NextResponse.json({ success: true, invite }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof HttpError) return httpError(error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: (error as Error).message || String(error) }, { status: 400 });
  }
}
