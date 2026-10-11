import crypto from "node:crypto";
import { JobQueueService } from "@/application/services/JobQueue";
import { httpError } from "@/lib/http";
export const runtime = "nodejs";
export const maxDuration = 60;
let nextHealthCheck = 0;
export async function POST(request: Request) {
  const expected = process.env.JOB_WORKER_SECRET;
  const provided =
    request.headers.get("authorization")?.replace(/^Bearer /, "") || "";
  if (
    !expected ||
    expected.length < 32 ||
    Buffer.byteLength(expected) !== Buffer.byteLength(provided) ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided))
  )
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    let processed = 0;
    const deadline = Date.now() + 25000;
    while (
      processed < 10 &&
      Date.now() < deadline &&
      (await JobQueueService.runNext())
    )
      processed++;
    let health;
    if (Date.now() >= nextHealthCheck) {
      nextHealthCheck = Date.now() + 60000;
      health = await JobQueueService.health();
    }
    return Response.json({ processed, health });
  } catch (error) {
    return httpError(error);
  }
}
