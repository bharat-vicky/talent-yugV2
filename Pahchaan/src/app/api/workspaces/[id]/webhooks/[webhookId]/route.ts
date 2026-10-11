import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { RBACService } from "@/application/services/RBACService";
import { WebhookService } from "@/application/services/WebhookService";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; webhookId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, webhookId } = await params;
    
    const hasAccess = await RBACService.checkPermission(session.user.id, id, "manager");
    if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await WebhookService.deleteWebhook(webhookId, id);
    
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message || String(error) }, { status: 500 });
  }
}
