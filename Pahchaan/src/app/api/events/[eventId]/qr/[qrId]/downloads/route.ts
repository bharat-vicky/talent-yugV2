import {apiSchemas} from "@/lib/api-schemas";
import {z} from "zod";
import {readJson,HttpError,httpError} from "@/lib/http";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eventRepository } from "@/infrastructure/repositories/EventRepository";
import { QRService } from "@/application/services/QRService";

export async function POST(req: NextRequest, { params }: { params: Promise<{ eventId: string; qrId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId, qrId } = await params;
  const event = await eventRepository.findById(eventId);
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  try {
    const { format } = apiSchemas.download.parse(await readJson(req));
    const ip = req.headers.get("x-forwarded-for") || undefined;
    
    await QRService.logDownload(session.user.id, event.workspaceId, eventId, qrId, format, undefined, ip);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof HttpError || err instanceof z.ZodError) return httpError(err);
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
