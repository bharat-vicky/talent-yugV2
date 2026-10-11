import { z } from "zod";
import { AccountService } from "@/application/services/AccountService";
import {
  checkOrigin,
  readJson,
  rateLimit,
  httpError,
  HttpError,
} from "@/lib/http";
import { normalizeEmail } from "@/lib/email";
import { assertAccountDeliveryConfigured } from "@/lib/account-delivery";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  try {
    checkOrigin(request);
    const { action } = await params;
    if (
      !["register", "resend", "forgot", "verify", "reset", "check"].includes(
        action,
      )
    )
      throw new HttpError("Not found", 404);
    const body = await readJson(request, 4096);
    if (action === "check") {
      await rateLimit(request, "account:check", "", 30);
      await AccountService.checkToken(
        z.string().parse(body.token),
        z.enum(["verify", "reset"]).parse(body.purpose),
      );
      return Response.json(
        { valid: true },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    if (["register", "resend", "forgot"].includes(action)) {
      const email = z
        .string()
        .email()
        .max(254)
        .parse(normalizeEmail(z.string().parse(body.email)));
      await rateLimit(request, `account:${action}`, email, 5);
      assertAccountDeliveryConfigured();
      if (action === "register") await AccountService.register(email);
      else
        await AccountService.requestToken(
          email,
          action === "forgot" ? "reset" : "verify",
        );
      return Response.json(
        {
          message:
            "If the address is eligible, an email will arrive shortly. Check your inbox and spam folder.",
        },
        { status: 202 },
      );
    }
    await rateLimit(request, `account:${action}`, "", 20);
    const token = z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .parse(body.token);
    await AccountService.consumeToken(
      token,
      action === "verify" ? "verify" : "reset",
      z.string().parse(body.password),
    );
    return Response.json({
      message:
        action === "verify"
          ? "Email verified. You can sign in now."
          : "Password changed. Sign in with your new password.",
    });
  } catch (error) {
    return httpError(error);
  }
}
