import crypto from "node:crypto";
import getMongoClient from "@/infrastructure/db";

export class RateLimitService {
  static async consume(key: string, limit: number, windowMs: number): Promise<boolean> {
    const now = Date.now();
    const window = Math.floor(now / windowMs);
    const id = crypto.createHash("sha256").update(`${key}:${window}`).digest("hex");
    const col = (await getMongoClient()).db().collection<{ _id: string; count: number; expiresAt: Date }>("rate_limits");
    let entry;
    try {
      entry = await col.findOneAndUpdate({ _id: id }, { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((window + 2) * windowMs) } }, { upsert: true, returnDocument: "after" });
    } catch (error) {
      if ((error as { code?: number }).code !== 11000) throw error;
      entry = await col.findOneAndUpdate({ _id: id }, { $inc: { count: 1 } }, { returnDocument: "after" });
    }
    return !!entry && entry.count <= limit;
  }
}
