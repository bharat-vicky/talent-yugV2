import { z } from "zod";
import { MongoNetworkError, MongoServerSelectionError } from "mongodb";
import { RateLimitService } from "@/application/services/RateLimitService";

export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export async function readJson(
  request: Request,
  maxBytes = 65536,
): Promise<Record<string, unknown>> {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new HttpError("JSON content type required", 415);
  if (Number(request.headers.get("content-length")) > maxBytes)
    throw new HttpError("Request too large", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError("Request body required", 400);
  let bytes = 0;
  const chunks: Uint8Array[] = [];
  try {
    for (;;) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > maxBytes) {
        await reader.cancel();
        throw new HttpError("Request too large", 413);
      }
      chunks.push(part.value);
    }
    const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      throw new HttpError("JSON object required", 400);
    return parsed as Record<string, unknown>;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError("Invalid JSON", 400);
  } finally {
    reader.releaseLock();
  }
}

export function checkOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  const site = request.headers.get("sec-fetch-site");
  const appOrigin = new URL(
    process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || request.url,
  ).origin;
  if (site === "cross-site" || (origin && origin !== appOrigin))
    throw new HttpError("Forbidden origin", 403);
}

export async function rateLimit(
  request: Request,
  scope: string,
  identity = "",
  limit = 20,
): Promise<void> {
  // Only trust forwarded IPs when the deployment explicitly enables its trusted proxy.
  const ip =
    process.env.TRUST_PROXY === "true"
      ? request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        "unknown"
      : "shared";
  if (
    !(await RateLimitService.consume(
      `${scope}:ip:${ip}`,
      limit * (ip === "shared" ? 10 : 1),
      600000,
    )) ||
    (identity &&
      !(await RateLimitService.consume(
        `${scope}:identity:${identity}`,
        limit,
        600000,
      )))
  )
    throw new HttpError("Too many requests. Try again later.", 429);
}

export function httpError(error: unknown): Response {
  if (error instanceof HttpError)
    return Response.json({ error: error.message }, { status: error.status });
  if (error instanceof z.ZodError)
    return Response.json(
      { error: "Invalid input", details: error.flatten() },
      { status: 400 },
    );
  if (
    error instanceof MongoNetworkError ||
    error instanceof MongoServerSelectionError
  ) {
    // Avoid exposing raw topology/connection errors, which include hostnames.
    console.error("Database connection unavailable", { name: error.name });
    return Response.json(
      {
        error:
          "The service is temporarily unable to connect to the database. Please try again shortly.",
        code: "DATABASE_UNAVAILABLE",
      },
      {
        status: 503,
        headers: { "Retry-After": "30", "Cache-Control": "no-store" },
      },
    );
  }
  console.error(
    "Request failed",
    error instanceof Error ? error.name : "Unknown error",
  );
  return Response.json(
    { error: "Request could not be completed" },
    { status: 500 },
  );
}
