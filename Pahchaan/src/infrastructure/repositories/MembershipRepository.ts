import { MongoRepository } from "./MongoRepository";
import { Membership } from "@/domain/types";

export class MembershipRepository extends MongoRepository<Membership> {
  constructor() {
    super("memberships");
  }

  async findByUserId(userId: string): Promise<Membership[]> {
    return this.findMany({ userId });
  }

  async findByWorkspaceId(workspaceId: string): Promise<Membership[]> {
    return this.findMany({ workspaceId });
  }
}

export const membershipRepository = new MembershipRepository();
