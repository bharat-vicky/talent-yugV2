import { Binary, ObjectId } from "mongodb";
import crypto from "node:crypto";
import { collection } from "@/infrastructure/transaction";
export interface IStorageAdapter {
  uploadFile(file: Buffer, filename: string, mimeType: string, workspaceId: string): Promise<string>;
  deleteFile(fileUrl: string, workspaceId: string): Promise<void>;
}
export class MongoStorageAdapter implements IStorageAdapter {
  async uploadFile(file: Buffer, filename: string, mimeType: string, workspaceId: string): Promise<string> {
    if (!ObjectId.isValid(workspaceId) || !file.length || file.length > 5 * 1024 * 1024) throw new Error("Workspace and a file under 5 MB are required");
    if (!["image/png","image/jpeg","application/pdf","text/plain"].includes(mimeType)) throw new Error("File type is not supported");
    const valid = mimeType === "image/png" ? file.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : mimeType === "image/jpeg" ? file[0] === 255 && file[1] === 216 : mimeType === "application/pdf" ? file.subarray(0,5).toString() === "%PDF-" : !file.includes(0);
    if (!valid) throw new Error("File content does not match its type");
    const safeName = filename.replace(/[^a-zA-Z0-9._ -]/g,"_").slice(0,150) || "attachment";
    const result = await (await collection("stored_files")).insertOne({ workspaceId, filename: safeName, mimeType, size: file.length, sha256: crypto.createHash("sha256").update(file).digest("hex"), data: new Binary(file), createdAt: new Date() });
    return `/pahchaan/api/files/${result.insertedId}`;
  }
  async deleteFile(url: string, workspaceId: string) {
    const match = /^\/(?:pahchaan\/)?api\/files\/([a-f0-9]{24})$/.exec(url);
    if (!match) throw new Error("Invalid file URL");
    await (await collection("stored_files")).deleteOne({ _id: new ObjectId(match[1]), workspaceId });
  }
}
export class StorageService {
  private static adapter: IStorageAdapter = new MongoStorageAdapter();
  static setAdapter(adapter: IStorageAdapter) { this.adapter = adapter; }
  static async upload(file: Buffer, filename: string, mimeType: string, workspaceId: string) { return this.adapter.uploadFile(file,filename,mimeType,workspaceId); }
  static async delete(url: string, workspaceId: string) { return this.adapter.deleteFile(url,workspaceId); }
}
