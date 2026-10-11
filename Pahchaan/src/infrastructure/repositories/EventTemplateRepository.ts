import {literalSearch,validatePage} from "@/lib/query";
import { MongoRepository } from "./MongoRepository";
import { EventTemplate } from "@/domain/types";
import { ObjectId } from "mongodb";

export interface TemplateSearchOptions {
  workspaceId?: string;
  category?: string;
  search?: string;
  isOfficial?: boolean;
  status?: string;
  visibility?: string;
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: "usageCount" | "createdAt" | "updatedAt" | "name";
  sortOrder?: "asc" | "desc";
}

export class EventTemplateRepository extends MongoRepository<EventTemplate> {
  constructor() {
    super("event_templates");
  }

  async findSystemTemplates(): Promise<EventTemplate[]> {
    const collection = await this.getCollection();
    return collection.find({ isOfficial: true }).toArray() as unknown as Promise<EventTemplate[]>;
  }

  async findByWorkspaceId(workspaceId: string): Promise<EventTemplate[]> {
    const collection = await this.getCollection();
    return collection.find({ workspaceId }).toArray() as unknown as Promise<EventTemplate[]>;
  }

  async incrementUsage(id: string): Promise<void> {
    const collection = await this.getCollection();
    await collection.updateOne(
      { _id: new ObjectId(id) as unknown as ObjectId }, // Type cast workaround
      { 
        $inc: { usageCount: 1 }, 
        $set: { lastUsedAt: new Date() } 
      }
    );
  }

  async incrementFavorite(id: string, amount: number = 1): Promise<void> {
    const collection = await this.getCollection();
    await collection.updateOne(
      { _id: new ObjectId(id) as unknown as ObjectId },
      { $inc: { favoriteCount: amount } }
    );
  }

  async searchTemplates(options: TemplateSearchOptions) {
    const collection = await this.getCollection();
    const {
      workspaceId,
      category,
      search,
      isOfficial,
      status = "published",
      visibility,
      page = 1,
      limit = 12,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = options;

    validatePage(page,limit);
    const query: Record<string, unknown> = {};

    if (workspaceId) {
      // If workspaceId is provided, we might want workspace templates OR official templates
      if (isOfficial === true) {
        query.isOfficial = true;
      } else if (isOfficial === false) {
        query.workspaceId = workspaceId;
      } else {
        query.$or = [{ workspaceId }, { isOfficial: true }];
      }
    } else if (isOfficial !== undefined) {
      query.isOfficial = isOfficial;
    }

    if (category) query.category = category;
    if (status) query.status = status;
    if (visibility) query.visibility = visibility;

    if (search) {
      query.$or = [
        { name: { $regex: literalSearch(search), $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    const sortConfig: Record<string, 1 | -1> = {};
    sortConfig[sortBy] = sortOrder === "desc" ? -1 : 1;

    const skip = (page - 1) * limit;

    const [templates, total] = await Promise.all([
      collection.find(query).sort(sortConfig).skip(skip).limit(limit).toArray(),
      collection.countDocuments(query)
    ]);

    return {
      templates: templates as unknown as EventTemplate[],
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }
}

export const eventTemplateRepository = new EventTemplateRepository();
