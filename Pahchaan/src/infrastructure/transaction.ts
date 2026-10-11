import { AsyncLocalStorage } from "node:async_hooks";
import type { ClientSession, Collection, Document } from "mongodb";
import getMongoClient from "./db";

const context = new AsyncLocalStorage<ClientSession>();

export function sessionCollection(collection: Collection<Document>): Collection<Document> {
  const session = context.getStore();
  if (!session) return collection;
  const positions: Record<string, number> = {
    find: 1, findOne: 1, countDocuments: 1, aggregate: 1, insertOne: 1,
    insertMany: 1, updateOne: 2, updateMany: 2, findOneAndUpdate: 2,
    deleteOne: 1, deleteMany: 1, replaceOne: 2, bulkWrite: 1,
  };
  return new Proxy(collection, {
    get(target, property) {
      const value = Reflect.get(target, property, target);
      if (typeof value !== "function") return value;
      const position = positions[String(property)];
      if (position === undefined) return value.bind(target);
      return (...args: unknown[]) => {
        args[position] = { ...(args[position] as Record<string, unknown> | undefined), session };
        return value.apply(target, args);
      };
    },
  });
}

export async function collection(name: string) {
  return sessionCollection((await getMongoClient()).db().collection(name));
}

export async function withTransaction<T>(work: () => Promise<T>): Promise<T> {
  if (context.getStore()) return work();
  const session = (await getMongoClient()).startSession();
  try {
    return await session.withTransaction(() => context.run(session, work), {
      readConcern: { level: "snapshot" }, writeConcern: { w: "majority" }, maxCommitTimeMS: 10000,
    }) as T;
  } finally { await session.endSession(); }
}

export async function lockEvent(eventId: string) {
  const { ObjectId } = await import("mongodb");
  if (!ObjectId.isValid(eventId)) throw new Error("Invalid event ID");
  const result = await (await collection("events")).updateOne(
    { _id: new ObjectId(eventId) }, { $inc: { registrationRevision: 1 } }
  );
  if (!result.matchedCount) throw new Error("Event not found");
}
