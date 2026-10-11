import {apiSchemas} from "@/lib/api-schemas";
import {z} from "zod";
import {readJson,HttpError,httpError} from "@/lib/http";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { RBACService } from "@/application/services/RBACService";
import { WebhookService } from "@/application/services/WebhookService";
import { webhookRepository } from "@/infrastructure/repositories/WebhookRepository";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    
    const hasAccess = await RBACService.checkPermission(session.user.id, id, "manager");
    if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const webhooks = await webhookRepository.findByWorkspaceId(id);
    
    // Hide secrets from list endpoint
    const safeWebhooks = webhooks.map(w => ({ ...w, secret: "••••••••••••••••••••••••" }));
    
    return NextResponse.json(safeWebhooks);
  } catch (error: unknown) {
    if (error instanceof HttpError || error instanceof z.ZodError) return httpError(error);
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

    const { id } = await params;
    
    const hasAccess = await RBACService.checkPermission(session.user.id, id, "manager");
    if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = apiSchemas.webhook.parse(await readJson(req));
    if (!body.name || !body.endpointUrl || !body.events) {
      return NextResponse.json({ error: "Name, endpointUrl, and events are required" }, { status: 400 });
    }

    const webhook = await WebhookService.registerWebhook(id, body.name, body.endpointUrl, body.events);
    
    return NextResponse.json(webhook);
  } catch (error: unknown) {
    if (error instanceof HttpError || error instanceof z.ZodError) return httpError(error);
    return NextResponse.json({ error: (error as Error).message || String(error) }, { status: 500 });
  }
}
