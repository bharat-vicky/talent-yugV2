import crypto from "node:crypto";
import { ObjectId } from "mongodb";
import { webhookRepository } from "@/infrastructure/repositories/WebhookRepository";
import { collection } from "@/infrastructure/transaction";
import { webhookUrl, postWebhook } from "@/lib/outbound-http";
import { JobQueueService } from "./JobQueue";
export class WebhookService {
  static async registerWebhook(workspaceId: string, name: string, endpointUrl: string, events: string[]) {
    webhookUrl(endpointUrl);
    return webhookRepository.create({ workspaceId, name, endpointUrl, secret: crypto.randomBytes(32).toString("hex"), events, status: "active", failureCount: 0 });
  }
  static async deleteWebhook(webhookId: string, workspaceId: string) {
    const webhook = await webhookRepository.findById(webhookId);
    if (!webhook || webhook.workspaceId !== workspaceId) throw new Error("Webhook not found for this workspace");
    return webhookRepository.delete(webhookId);
  }
  static async dispatchEvent(workspaceId: string, eventType: string, payload: unknown) {
    for (const webhook of await webhookRepository.findByEvent(workspaceId,eventType)) {
      await JobQueueService.enqueue("webhook", { workspaceId, webhookId: webhook._id, deliveryId: crypto.randomUUID(), dataString: JSON.stringify({ event: eventType, timestamp: new Date().toISOString(), payload }) });
    }
  }
  static async deliver(payload: Record<string,unknown>) {
    const webhook = await webhookRepository.findById(String(payload.webhookId));
    if (!webhook || webhook.workspaceId !== payload.workspaceId || !["active","failing"].includes(webhook.status)) return { skipped: true };
    const data = String(payload.dataString), signature = crypto.createHmac("sha256",webhook.secret).update(data).digest("hex");
    const webhooks = await collection("webhooks");
    try {
      await postWebhook(webhook.endpointUrl,data,{ "Content-Type": "application/json", "X-Identity-Signature": signature, "X-Identity-Delivery": String(payload.deliveryId) });
      await webhooks.updateOne({ _id: new ObjectId(webhook._id), workspaceId: webhook.workspaceId },{ $set: { lastDelivery: new Date(), failureCount: 0, status: "active" } });
      return { delivered: true };
    } catch (error) {
      await webhooks.updateOne({ _id: new ObjectId(webhook._id), workspaceId: webhook.workspaceId },{ $inc: { failureCount: 1 }, $set: { status: "failing", lastFailure: new Date() } });
      throw error;
    }
  }
}
