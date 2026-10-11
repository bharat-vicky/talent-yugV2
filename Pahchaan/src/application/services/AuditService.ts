import { auditLogRepository } from "@/infrastructure/repositories/AuditLogRepository";

export class AuditService {
  static async log(userId: string, action: string, details: unknown, workspaceId?: string) {
    try {
      await auditLogRepository.create({
        userId,
        action,
        details,
        workspaceId,
      });
    } catch (error) {
      console.error("Failed to write audit log:", error);
    }
  }
}
