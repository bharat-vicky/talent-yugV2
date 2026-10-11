import { Collection, ObjectId, Document } from "mongodb";
import getMongoClient from "../db";
import { Repository } from "@/domain/repository";
import { sessionCollection } from "../transaction";

export abstract class MongoRepository<T extends { _id?: string | ObjectId }> implements Repository<T> {
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  protected async getCollection(): Promise<Collection<Document>> {
    const client = await getMongoClient();
    return sessionCollection(client.db().collection(this.collectionName));
  }

  async findById(id: string): Promise<T | null> {
    if (typeof id !== "string" || !ObjectId.isValid(id)) return null;
    const collection = await this.getCollection();
    const result = await collection.findOne({ _id: new ObjectId(id) });
    if (!result) return null;
    return { ...result, _id: result._id.toString() } as unknown as T;
  }

  async findAll(): Promise<T[]> {
    const collection = await this.getCollection();
    const results = await collection.find({}).toArray();
    return results.map(r => ({ ...r, _id: r._id.toString() })) as unknown as T[];
  }

  async create(item: Partial<T>): Promise<T> {
    const collection = await this.getCollection();
    const doc = { ...item, createdAt: new Date(), updatedAt: new Date() };
    delete doc._id;
    const result = await collection.insertOne(doc as Document);
    return { ...doc, _id: result.insertedId.toString() } as unknown as T;
  }

  async update(id: string, item: Partial<T>): Promise<T | null> {
    const collection = await this.getCollection();
    const updateDoc = { ...item, updatedAt: new Date() };
    delete updateDoc._id; // prevent updating immutable field
    
    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateDoc }
    );
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const collection = await this.getCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  }

  async findMany(query: Record<string, unknown>): Promise<T[]> {
    const collection = await this.getCollection();
    const results = await collection.find(query).toArray();
    return results.map(r => ({ ...r, _id: r._id.toString() })) as unknown as T[];
  }

  async findOne(query: Record<string, unknown>): Promise<T | null> {
    const collection = await this.getCollection();
    const result = await collection.findOne(query);
    if (!result) return null;
    return { ...result, _id: result._id.toString() } as unknown as T;
  }

  async deleteMany(query: Record<string, unknown>): Promise<number> {
    const collection = await this.getCollection();
    const result = await collection.deleteMany(query);
    return result.deletedCount;
  }
}
