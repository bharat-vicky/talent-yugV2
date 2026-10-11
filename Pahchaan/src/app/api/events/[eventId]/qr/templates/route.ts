import {apiSchemas} from "@/lib/api-schemas";
import {z} from "zod";
import {readJson,HttpError,httpError} from "@/lib/http";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eventRepository } from "@/infrastructure/repositories/EventRepository";
import { QRService } from "@/application/services/QRService";

export async function GET(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId } = await params;
  const event = await eventRepository.findById(eventId);
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  try {
    const templates = await QRService.getTemplates(session.user.id, event.workspaceId);
    return NextResponse.json(templates);
  } catch (err: unknown) {
    if (err instanceof HttpError || err instanceof z.ZodError) return httpError(err);
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId } = await params;
  const event = await eventRepository.findById(eventId);
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  try {
    const { RBACService } = await import("@/application/services/RBACService");
    await RBACService.requirePermission(session.user.id, event.workspaceId, "manager");

    const { name, description, design } = apiSchemas.template.parse(await readJson(req));

    if (!name || !design) {
      return NextResponse.json({ error: "Name and design are required" }, { status: 400 });
    }

    const { qrTemplateRepository } = await import("@/infrastructure/repositories/QRRepositories");
    const { AuditService } = await import("@/application/services/AuditService");

    const template = await qrTemplateRepository.create({
      name,
      description,
      workspaceId: event.workspaceId,
      design,
      isSystem: false,
    });

    await AuditService.log(session.user.id, "QR_TEMPLATE_CREATED", { templateId: template._id, name }, event.workspaceId);

    return NextResponse.json(template, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof HttpError || err instanceof z.ZodError) return httpError(err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
