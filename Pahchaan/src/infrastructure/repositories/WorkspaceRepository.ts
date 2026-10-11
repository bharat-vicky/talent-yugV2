import { MongoRepository } from "./MongoRepository";
import { Workspace } from "@/domain/types";

export class WorkspaceRepository extends MongoRepository<Workspace> {
  constructor() {
    super("workspaces");
  }

  async findBySlug(slug: string): Promise<Workspace | null> {
    return this.findOne({ slug });
  }
}

export const workspaceRepository = new WorkspaceRepository();
