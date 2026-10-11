import {literalSearch} from "@/lib/query";
import { MongoRepository } from "./MongoRepository";
import { GuestDocument, GuestGroup } from "@/domain/types";
import { ObjectId, Filter } from "mongodb";
import { CheckInRecord } from "@/domain/types";

export class GuestRepository extends MongoRepository<GuestDocument> {
  constructor() {
    super("guests");
  }

  async findByEventId(eventId: string, options?: { 
    skip?: number; 
    limit?: number;
    status?: string;
    search?: string;
    groupId?: string;
  }): Promise<{ data: GuestDocument[], total: number }> {
    const filter: Filter<GuestDocument> = { eventId };

    if (options?.status) {
      filter.status = options.status as GuestDocument["status"];
    }
    
    if (options?.groupId) {
      filter.groupIds = options.groupId;
    }

    if (options?.search) {
      filter.$or = [
        { firstName: { $regex: literalSearch(options.search), $options: "i" } },
        { lastName: { $regex: literalSearch(options.search), $options: "i" } },
        { email: { $regex: literalSearch(options.search), $options: "i" } },
        { organization: { $regex: literalSearch(options.search), $options: "i" } }
      ];
    }

    const collection = await this.getCollection();
    
    const cursor = collection.find(filter as unknown as import("mongodb").Filter<import("mongodb").Document>).sort({ createdAt: -1, _id: -1 });
    
    if (options?.skip !== undefined) cursor.skip(options.skip);
    if (options?.limit !== undefined) cursor.limit(options.limit);
    
    const data = await cursor.toArray() as unknown as GuestDocument[];
    const total = await collection.countDocuments(filter as unknown as import("mongodb").Filter<import("mongodb").Document>);
    
    return { data, total };
  }

  async findByIds(ids: string[]): Promise<GuestDocument[]> {
    const collection = await this.getCollection();
    const objectIds = ids.map(id => new ObjectId(id));
    const results = await collection.find({ _id: { $in: objectIds } }).toArray();
    return results.map(r => ({ ...r, _id: r._id.toString() })) as unknown as GuestDocument[];
  }

  async insertMany(guests: Omit<GuestDocument, "_id">[]): Promise<string[]> {
    const collection = await this.getCollection();
    const result = await collection.insertMany(guests as unknown as import("mongodb").OptionalId<import("mongodb").Document>[]);
    return Object.values(result.insertedIds).map(id => id.toString());
  }

  async updateManyStatus(guestIds: string[], status: string, workspaceId: string, eventId: string): Promise<number> {
    const collection = await this.getCollection();
    const objectIds = guestIds.map(id => new ObjectId(id));
    
    const result = await collection.updateMany(
      { _id: { $in: objectIds }, workspaceId, eventId },
      { 
        $set: { 
          status,
          updatedAt: new Date()
        } 
      } as unknown as Parameters<typeof collection.updateMany>[1]
    );
    
    return result.modifiedCount;
  }

  async recordCheckIn(guestId: string, workspaceId: string, eventId: string, record: CheckInRecord): Promise<boolean> {
    const collection = await this.getCollection();
    const allowed = record.direction === "in" ? ["approved", "checked_out"] : ["checked_in"];
    const result = await collection.updateOne(
      { _id: new ObjectId(guestId), workspaceId, eventId, status: { $in: allowed } },
      {
        $push: { checkIns: record } as unknown as import("mongodb").PushOperator<import("mongodb").Document>,
        $set: { status: record.direction === "in" ? "checked_in" : "checked_out", updatedAt: record.timestamp },
      }
    );
    return result.modifiedCount === 1;
  }
}

export class GuestGroupRepository extends MongoRepository<GuestGroup> {
  constructor() {
    super("guest_groups");
  }

  async findByEventId(eventId: string): Promise<GuestGroup[]> {
    const collection = await this.getCollection();
    return collection.find({ eventId }).sort({ name: 1 }).toArray() as unknown as GuestGroup[];
  }
}

export const guestRepository = new GuestRepository();
export const guestGroupRepository = new GuestGroupRepository();
