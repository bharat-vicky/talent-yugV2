import {encryptJobPayload,decryptJobPayload} from "@/lib/job-encryption";
import crypto from "node:crypto";
import { ObjectId, Document } from "mongodb";
import { collection } from "@/infrastructure/transaction";

export interface Job {
  id: string;
  type: "email" | "sms" | "webhook" | "bulk_approve" | "bulk_export" | "mass_qr_generation" | "bulk_import";
  payload?: unknown;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  attempts: number;
  result?: unknown;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

type Handler = (payload: unknown) => Promise<unknown>;
export class JobQueueService {
  private static handlers = new Map<Job["type"], Handler>();

  static registerHandler(type: Job["type"], handler: Handler) { this.handlers.set(type, handler); }

  static async enqueue(type: Job["type"], payload: unknown): Promise<string> {
    const now = new Date();
    const workspaceId = payload && typeof payload === "object" && "workspaceId" in payload ? String(payload.workspaceId) : undefined;
    const eventId = payload && typeof payload === "object" && "eventId" in payload ? String(payload.eventId) : undefined;
    const result = await (await collection("jobs")).insertOne({ type, workspaceId, eventId, encryptedPayload: encryptJobPayload(payload), expiresAt: new Date(Date.now()+30*86400000), status: "pending", progress: 0, attempts: 0, availableAt: now, createdAt: now, updatedAt: now });
    return result.insertedId.toString();
  }

  static async getJobStatus(id: string, workspaceId: string): Promise<Job | null> {
    if (!ObjectId.isValid(id)) return null;
    const job = await (await collection("jobs")).findOne({ _id: new ObjectId(id), workspaceId }, { projection: { payload: 0, encryptedPayload: 0, leaseToken: 0 } });
    return job ? { ...job, id: job._id.toString() } as unknown as Job : null;
  }

  static async runNext(): Promise<boolean> {
    const jobs = await collection("jobs");
    const now = new Date(), leaseToken = crypto.randomUUID();
    await jobs.updateMany({ status: "processing", attempts: { $gte: 5 }, leaseUntil: { $lt: now } }, { $set: { status: "failed", error: "Worker lease expired after maximum attempts", updatedAt: now }, $unset: { leaseToken: "", leaseUntil: "" } });
    const job = await jobs.findOneAndUpdate({ attempts: { $lt: 5 }, $or: [{ status: "pending", availableAt: { $lte: now } }, { status: "processing", leaseUntil: { $lt: now } }] }, {
      $set: { status: "processing", leaseToken, leaseUntil: new Date(Date.now() + 60000), updatedAt: now }, $inc: { attempts: 1 }
    }, { returnDocument: "after", sort: { availableAt: 1 } });
    if (!job) return false;
    // Long operations renew the lease; completion and retries require ownership.
    const heartbeat = setInterval(() => { void jobs.updateOne({ _id: job._id, leaseToken, status: "processing" }, { $set: { leaseUntil: new Date(Date.now() + 60000) } }).catch(() => console.error("Worker lease renewal failed")); }, 20000);
    try {
      job.payload = decryptJobPayload(job.encryptedPayload);
      const handler = this.handlers.get(job.type);
      const result = handler ? await handler(job.payload) : await this.deliver(job);
      await jobs.updateOne({ _id: job._id, leaseToken }, { $set: { status: "completed", progress: 100, result: result ?? null, updatedAt: new Date() },  $unset: { encryptedPayload: "", payload: "", leaseToken: "", leaseUntil: "", error: "" } });
    } catch (error) {
      await jobs.updateOne({ _id: job._id, leaseToken }, { $set: { status: job.attempts >= 5 ? "failed" : "pending", error: error instanceof Error ? error.message.slice(0, 300) : "Delivery failed", availableAt: new Date(Date.now() + Math.min(3600000, 1000 * 2 ** job.attempts)), updatedAt: new Date() }, $unset: { leaseToken: "", leaseUntil: "" } });
    } finally { clearInterval(heartbeat); }
    return true;
  }

  private static async deliver(job: Document): Promise<unknown> {
    const payload = job.payload as Record<string, unknown>;
    if (job.type === "email") {
      const { EmailService } = await import("./EmailService");
      return EmailService.deliver(payload);
    }
    if (job.type === "sms") {
      const { SmsService } = await import("./SmsService");
      return SmsService.deliver(payload);
    }
    if (job.type === "webhook") {
      const { WebhookService } = await import("./WebhookService");
      return WebhookService.deliver(payload);
    }
    // Explicitly registered handlers perform bulk work; never simulate success.
    throw new Error(`No worker handler configured for ${job.type}`);
  }
}
