import { MongoRepository } from "./MongoRepository";
import { Webhook } from "@/domain/types";

class WebhookRepositoryImpl extends MongoRepository<Webhook> {
  constructor() {
    super("webhooks");
  }

  async findByWorkspaceId(workspaceId: string): Promise<Webhook[]> {
    return this.findMany({ workspaceId });
  }

  async findByEvent(workspaceId: string, event: string): Promise<Webhook[]> {
    return this.findMany({ workspaceId, events: event, status: "active" });
  }
}

export const webhookRepository = new WebhookRepositoryImpl();
