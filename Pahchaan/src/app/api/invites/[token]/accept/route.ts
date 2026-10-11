import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { WorkspaceService } from "@/application/services/WorkspaceService";
import { checkOrigin } from "@/lib/http";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    checkOrigin(req);
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { token } = await params;

    const result = await WorkspaceService.acceptInvite(token, session.user.id);

    return NextResponse.json({ success: true, workspaceId: result.workspaceId });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message || String(error) }, { status: 400 });
  }
}
