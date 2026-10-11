import { MongoRepository } from "./MongoRepository";
import { AuditLog } from "@/domain/types";

export class AuditLogRepository extends MongoRepository<AuditLog> {
  constructor() {
    super("audit_logs");
  }
}

export const auditLogRepository = new AuditLogRepository();
