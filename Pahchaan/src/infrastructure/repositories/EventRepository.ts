import { ObjectId } from "mongodb";
import { MongoRepository } from "./MongoRepository";
import { Event } from "@/domain/types";
export class EventRepository extends MongoRepository<Event> {
  constructor() { super("events"); }
  async findByWorkspaceId(workspaceId: string): Promise<Event[]> { return this.findMany({workspaceId}); }
  async findBySlug(workspaceId: string, slug: string): Promise<Event|null> { return this.findOne({workspaceId,slug}); }
  async findByUniqueSlug(value: string): Promise<Event|null> {
    if (!value || value.length > 200) return null;
    let slug = value;
    try { slug = decodeURIComponent(value); } catch { return null; }
    if (!/^[a-zA-Z0-9._/-]+$/.test(slug)) return null;
    const matches = await this.findMany({$or:[{uniqueSlug:slug},{slug},...(ObjectId.isValid(slug)?[{_id:new ObjectId(slug)}]:[])]});
    return matches.length === 1 ? matches[0] : null;
  }
}
export const eventRepository = new EventRepository();
