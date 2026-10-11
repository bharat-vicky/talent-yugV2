import * as bcrypt from "bcrypt";
import crypto from "crypto";
import { apiKeyRepository } from "@/infrastructure/repositories/ApiKeyRepository";
import { ApiKey } from "@/domain/types";

export class ApiKeyService {
  
  /**
   * Generates a new API Key for a workspace.
   * Returns the plaintext key ONCE. The repository only stores the bcrypt hash.
   */
  static async generateKey(workspaceId: string, name: string, createdBy: string): Promise<{ apiKey: ApiKey, plaintextKey: string }> {
    
    // 1. Create a placeholder record to get an ID
    const initialKey = await apiKeyRepository.create({
      workspaceId,
      name,
      prefix: "idf_live_",
      lastFour: "",
      hash: "",
      createdBy,
      status: "active"
    });

    const keyId = initialKey._id as string;

    // 2. Generate secure random string
    const rawSecret = crypto.randomBytes(32).toString('hex');
    // 3. Embed the ID in the plaintext key so validateKey is O(1)
    const plaintextKey = `idf_live_${keyId}_${rawSecret}`;
    
    const lastFour = plaintextKey.slice(-4);
    
    // 4. Hash the token
    const salt = await bcrypt.genSalt(10);
    const digest = crypto.createHash("sha256").update(plaintextKey).digest("hex");
    const hash = "sha256:" + await bcrypt.hash(digest, salt);

    // 5. Update the record with the hash and lastFour
    const apiKey = await apiKeyRepository.update(keyId, {
      lastFour,
      hash
    });

    return { apiKey: apiKey as ApiKey, plaintextKey };
  }

  /**
   * Validates a provided plaintext key against stored hashes.
   */
  static async validateKey(plaintextKey: string): Promise<ApiKey | null> {
    // Format: idf_live_<keyId>_<secret>
    const parts = plaintextKey.split("_");
    if (parts.length !== 4) return null;
    if (parts[0] !== "idf" || parts[1] !== "live") return null;

    const keyId = parts[2];
    
    // O(1) Lookup
    const apiKey = await apiKeyRepository.findById(keyId);
    if (!apiKey || apiKey.status !== "active") return null;

    // Compare hash
    // Legacy raw bcrypt keys exceeded its 72-byte limit; regenerate them.
    if (!apiKey.hash.startsWith("sha256:")) return null;
    const digest = crypto.createHash("sha256").update(plaintextKey).digest("hex");
    const isValid = await bcrypt.compare(digest, apiKey.hash.slice(7));
    if (!isValid) return null;

    // Update last used asynchronously
    apiKeyRepository.update(keyId, { lastUsedAt: new Date() }).catch(() => {});

    return apiKey;
  }

  static async revokeKey(keyId: string, workspaceId: string) {
    const key = await apiKeyRepository.findById(keyId);
    if (!key || key.workspaceId !== workspaceId) throw new Error("API key not found for this workspace");
    return apiKeyRepository.update(keyId, { status: "revoked" });
  }

}
