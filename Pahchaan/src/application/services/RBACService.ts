import { membershipRepository } from "@/infrastructure/repositories/MembershipRepository";
import { Role } from "@/domain/types";

const ROLE_HIERARCHY: Record<Role, number> = {
  owner: 50,
  admin: 40,
  manager: 30,
  member: 20,
  viewer: 10,
};

export class RBACService {
  static async checkPermission(userId: string, workspaceId: string, requiredRole: Role): Promise<boolean> {
    if (userId === "system") return true;
    
    const memberships = await membershipRepository.findByUserId(userId);
    const membership = memberships.find((m) => m.workspaceId === workspaceId);
    
    if (!membership) return false;

    const userLevel = ROLE_HIERARCHY[membership.role] || 0;
    const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;

    return userLevel >= requiredLevel;
  }

  static async requirePermission(userId: string, workspaceId: string, requiredRole: Role): Promise<void> {
    const hasPerm = await this.checkPermission(userId, workspaceId, requiredRole);
    if (!hasPerm) {
      throw new Error(`Permission denied. Requires ${requiredRole} role.`);
    }
  }
}
