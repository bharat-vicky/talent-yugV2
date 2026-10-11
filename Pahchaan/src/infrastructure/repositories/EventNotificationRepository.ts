import { MongoRepository } from "./MongoRepository";
import { EventNotification } from "@/domain/types";
import { ObjectId } from "mongodb";

export class EventNotificationRepository extends MongoRepository<EventNotification> {
  constructor() {
    super("event_notifications");
  }

  async findByEvent(
    eventId: string,
    options?: { limit?: number; type?: string; unreadOnly?: boolean }
  ): Promise<EventNotification[]> {
    const collection = await this.getCollection();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { eventId };

    if (options?.type && options.type !== "all") {
      query.type = options.type;
    }

    if (options?.unreadOnly) {
      query.read = false;
    }

    const limit = options?.limit || 50;

    const results = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return results.map((r) => ({
      ...r,
      _id: r._id.toString(),
    })) as unknown as EventNotification[];
  }

  async countUnread(eventId: string): Promise<number> {
    const collection = await this.getCollection();
    return collection.countDocuments({ eventId, read: false });
  }

  async markAsRead(id: string): Promise<boolean> {
    const collection = await this.getCollection();
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { read: true, updatedAt: new Date() } }
    );
    return result.modifiedCount > 0;
  }

  async markAllAsRead(eventId: string): Promise<number> {
    const collection = await this.getCollection();
    const result = await collection.updateMany(
      { eventId, read: false },
      { $set: { read: true, updatedAt: new Date() } }
    );
    return result.modifiedCount;
  }

  async clearAll(eventId: string): Promise<number> {
    const collection = await this.getCollection();
    const result = await collection.deleteMany({ eventId });
    return result.deletedCount;
  }
}

export const eventNotificationRepository = new EventNotificationRepository();
