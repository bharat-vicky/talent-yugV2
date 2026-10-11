import {apiSchemas} from "@/lib/api-schemas";
import {z} from "zod";
import {readJson,HttpError,httpError} from "@/lib/http";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eventRepository } from "@/infrastructure/repositories/EventRepository";
import { qrTemplateRepository } from "@/infrastructure/repositories/QRRepositories";
import { RBACService } from "@/application/services/RBACService";
import { AuditService } from "@/application/services/AuditService";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string; templateId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId, templateId } = await params;
  const event = await eventRepository.findById(eventId);
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  try {
    await RBACService.requirePermission(session.user.id, event.workspaceId, "manager");

    const template = await qrTemplateRepository.findById(templateId);
    if (!template || template.workspaceId !== event.workspaceId || template.isSystem) return NextResponse.json({ error: "Template not found" }, { status: 404 });

    const body = apiSchemas.templateUpdate.parse(await readJson(req));
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.description !== undefined) updates.description = body.description.trim();
    if (body.design !== undefined) updates.design = body.design;

    await qrTemplateRepository.update(templateId, updates);

    await AuditService.log(
      session.user.id,
      "QR_TEMPLATE_UPDATED",
      { templateId, updates },
      event.workspaceId
    );

    const updated = await qrTemplateRepository.findById(templateId);
    return NextResponse.json(updated);
  } catch (err: unknown) {
    if (err instanceof HttpError || err instanceof z.ZodError) return httpError(err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string; templateId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId, templateId } = await params;
  const event = await eventRepository.findById(eventId);
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  try {
    await RBACService.requirePermission(session.user.id, event.workspaceId, "manager");

    const template = await qrTemplateRepository.findById(templateId);
    if (!template || template.workspaceId !== event.workspaceId || template.isSystem) return NextResponse.json({ error: "Template not found" }, { status: 404 });

    if (template.isSystem) {
      return NextResponse.json({ error: "System templates cannot be deleted" }, { status: 403 });
    }

    await qrTemplateRepository.delete(templateId);

    await AuditService.log(
      session.user.id,
      "QR_TEMPLATE_DELETED",
      { templateId, name: template.name },
      event.workspaceId
    );

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (err instanceof HttpError || err instanceof z.ZodError) return httpError(err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
