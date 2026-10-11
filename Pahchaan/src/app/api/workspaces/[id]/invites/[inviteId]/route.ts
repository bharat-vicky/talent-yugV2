import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { WorkspaceService } from "@/application/services/WorkspaceService";
import { RBACService } from "@/application/services/RBACService";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; inviteId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: workspaceId, inviteId } = await params;

    // Must be at least an admin to revoke invites
    const hasAccess = await RBACService.checkPermission(session.user.id, workspaceId, "admin");
    if (!hasAccess) return NextResponse.json({ error: "Forbidden. Must be an admin to revoke." }, { status: 403 });

    await WorkspaceService.revokeInvite(workspaceId, inviteId, session.user.id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message || String(error) }, { status: 400 });
  }
}
