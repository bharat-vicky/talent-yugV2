import { appUrl } from "@/lib/brand";
import crypto from "crypto";
import { qrCodeRepository } from "@/infrastructure/repositories/QRRepositories";
import { AuditService } from "./AuditService";
import { RBACService } from "./RBACService";
import { QRCodeDesignOptions, QRGenerationType } from "@/domain/types";

export interface BulkGenerationOptions {
  quantity: number;
  prefix?: string;
  startNumber?: number;
  padding?: number;
}

export class BulkGenerationService {
  static async generateSequentialBatch(
    userId: string,
    workspaceId: string,
    eventId: string,
    baseName: string,
    design: QRCodeDesignOptions,
    options: BulkGenerationOptions,
    destinationUrlBase?: string,
  ) {
    await RBACService.requirePermission(userId, workspaceId, "manager");

    const batchId = crypto.randomBytes(8).toString("hex");
    const { quantity, prefix = "QR-", startNumber = 1, padding = 4 } = options;

    const qrCodesToInsert = [];
    const createdIds: string[] = [];

    // NOTE: For very large batches (e.g. 1000+), this should ideally be pushed to a queue.
    // For now, we process it synchronously in a batch.

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    for (let i = 0; i < quantity; i++) {
      // Generate a 12-character random alphanumeric ID
      let randomId = '';
      const bytes = crypto.randomBytes(12);
      for (let j = 0; j < 12; j++) {
        randomId += chars[bytes[j] % chars.length];
      }
      
      const sequence = randomId;
      const shortId = randomId.substring(0, 8); // Use first 8 characters as shortId for URL payload
      
      // CRITICAL: The QR payload MUST include the unique ID, otherwise all QRs in the batch will be optically identical!
      const payloadUrl = destinationUrlBase ? `${destinationUrlBase}?id=${shortId}` : appUrl(`/scan?id=${shortId}`);

      const qr = {
        workspaceId,
        eventId,
        shortId,
        name: `${baseName} - ${sequence}`,
        description: `Generated as part of batch ${batchId}`,
        destinationUrl: payloadUrl,
        isDynamic: true,
        status: "published" as const, // Bulk generated are typically ready immediately
        design,
        scanCount: 0,
        batchId,
        generationType: "bulk_sequential" as QRGenerationType,
        sequence,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      qrCodesToInsert.push(qr);
    }

    // Insert into DB
    const client = await (await import("@/infrastructure/db")).default();
    const collection = client.db().collection("qr_codes");
    
    if (qrCodesToInsert.length > 0) {
      const result = await collection.insertMany(qrCodesToInsert);
      Object.values(result.insertedIds).forEach(id => createdIds.push(id.toString()));
    }

    await AuditService.log(
      userId, 
      "BULK_QR_GENERATED", 
      { batchId, quantity, eventId }, 
      workspaceId
    );

    return {
      batchId,
      quantity,
      createdIds
    };
  }
}
