import { z } from "zod";
import { NextResponse } from "next/server";
import { eventRepository } from "@/infrastructure/repositories/EventRepository";
import { registrationFormRepository } from "@/infrastructure/repositories/RegistrationFormRepository";
import { assertRegistrationOpen, RegistrationError } from "@/lib/registration-validation";
import { checkOrigin, readJson, rateLimit, httpError, HttpError } from "@/lib/http";
import { RegistrationEmailVerification } from "@/application/services/RegistrationEmailVerification";

const schema = z.object({slug: z.string().min(1).max(200), email: z.string().trim().email().max(254).transform(value => value.toLowerCase()), action: z.enum(["send", "verify"]), challenge: z.string().regex(/^[a-f0-9]{64}$/).optional(), code: z.string().regex(/^\d{6}$/).optional()});

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const body = schema.parse(await readJson(request));
    await rateLimit(request, `registration-otp-${body.action}`, body.email, body.action === "send" ? 5 : 20);
    const event = await eventRepository.findByUniqueSlug(body.slug);
    if (!event) throw new HttpError("Event not found", 404);
    const form = await registrationFormRepository.getOrCreateForEvent(event.workspaceId, String(event._id));
    assertRegistrationOpen(event, form);
    if (body.action === "send") {
      return NextResponse.json(await RegistrationEmailVerification.request(String(event._id), event.workspaceId, event.name, body.email), {status: 202});
    }
    if (!body.challenge || !body.code) throw new HttpError("Enter the six-digit code from your email.", 400);
    return NextResponse.json(await RegistrationEmailVerification.verify(String(event._id), body.email, body.challenge, body.code));
  } catch (error) { if (error instanceof RegistrationError) return NextResponse.json({error: error.message}, {status: error.status}); return httpError(error); }
}
