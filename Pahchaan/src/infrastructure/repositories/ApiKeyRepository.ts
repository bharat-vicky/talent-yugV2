import { MongoRepository } from "./MongoRepository";
import { ApiKey } from "@/domain/types";

class ApiKeyRepositoryImpl extends MongoRepository<ApiKey> {
  constructor() {
    super("api_keys");
  }

  async findByWorkspaceId(workspaceId: string): Promise<ApiKey[]> {
    return this.findMany({ workspaceId });
  }

  async findByHash(hash: string): Promise<ApiKey | null> {
    return this.findOne({ hash, status: "active" });
  }
}

export const apiKeyRepository = new ApiKeyRepositoryImpl();
