import { MongoRepository } from "./MongoRepository";
import { WorkspaceInvite } from "@/domain/types";

export class InviteRepository extends MongoRepository<WorkspaceInvite> {
  constructor() {
    super("workspace_invites");
  }

  async findPendingByWorkspaceId(workspaceId: string): Promise<WorkspaceInvite[]> {
    return this.findMany({ workspaceId, status: "pending" });
  }

  async findByToken(token: string): Promise<WorkspaceInvite | null> {
    return this.findOne({ token, status: "pending" });
  }

  async invalidateByEmailAndWorkspace(email: string, workspaceId: string): Promise<void> {
    const collection = await this.getCollection();
    await collection.updateMany(
      { email, workspaceId, status: "pending" },
      { $set: { status: "expired" } }
    );
  }
}

export const inviteRepository = new InviteRepository();
