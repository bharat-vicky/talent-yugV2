import { NextRequest, NextResponse } from "next/server";
import { eventRepository } from "@/infrastructure/repositories/EventRepository";
import { registrationFormRepository } from "@/infrastructure/repositories/RegistrationFormRepository";
import { RegistrationService } from "@/application/services/RegistrationService";
import { assertRegistrationOpen, RegistrationError } from "@/lib/registration-validation";
import { readJson, checkOrigin, rateLimit, httpError } from "@/lib/http";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string[] | string }> }
) {
  try {
    const resolvedParams = await params;
    const rawSlug = resolvedParams.slug;
    let slug = Array.isArray(rawSlug) ? rawSlug.join('/') : String(rawSlug || '');
    try {
      slug = decodeURIComponent(slug);
    } catch {}

    const event = await eventRepository.findByUniqueSlug(slug);
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    assertRegistrationOpen(event);

    const form = await registrationFormRepository.getOrCreateForEvent(event.workspaceId, event._id as string);
    if (!form) return NextResponse.json({ error: "Registration not configured" }, { status: 404 });
    assertRegistrationOpen(event, form);

    // Hide sensitive settings before returning to public
    const publicForm = {
      _id: form._id,
      eventId: form.eventId,
      fields: form.fields,
      settings: {
        openDate: form.settings?.openDate,
        closeDate: form.settings?.closeDate,
        capacity: form.settings?.capacity,
        allowWaitlist: form.settings?.allowWaitlist
      },
      branding: form.branding
    };

    const publicEvent = { _id: event._id, name: event.name, description: event.description, date: event.date, endDate: event.endDate, venue: event.venue, slug: event.slug };
    return NextResponse.json({ event: publicEvent, form: publicForm });
  } catch (error: unknown) {
    if (error instanceof RegistrationError) return NextResponse.json({ error: error.message }, { status: error.status });
    return httpError(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string[] | string }> }
) {
  try {
    checkOrigin(req);
    await rateLimit(req, "registration", "", 100);
    const resolvedParams = await params;
    const rawSlug = resolvedParams.slug;
    let slug = Array.isArray(rawSlug) ? rawSlug.join('/') : String(rawSlug || '');
    try {
      slug = decodeURIComponent(slug);
    } catch {}

    const event = await eventRepository.findByUniqueSlug(slug);
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const body = await readJson(req);
    const { answers } = body;

    if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const submission = await RegistrationService.submitRegistration(
      event._id as string,
      answers as Record<string, unknown>,
      {
        ip: process.env.TRUST_PROXY === "true" ? req.headers.get("x-forwarded-for")?.split(",")[0].slice(0,64) : undefined,
        userAgent: req.headers.get("user-agent")?.slice(0,512) || ""
      },
      req.headers.get("idempotency-key") || undefined
    );

    return NextResponse.json({ success: true, status: submission.status });
  } catch (error: unknown) {
    if (error instanceof RegistrationError) return NextResponse.json({ error: error.message }, { status: error.status });
    return httpError(error);
  }
}
