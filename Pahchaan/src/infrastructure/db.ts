import { MongoClient, ServerApiVersion } from "mongodb";

if (!process.env.MONGODB_URI) {
  console.warn('Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/identity_db";
const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  maxPoolSize: 10,
  minPoolSize: 1,
  maxIdleTimeMS: 60000,
  // Allow Atlas DNS/TLS and a brief election to settle on slower networks.
  // Failed initialization still resets the shared promise for the next request.
  connectTimeoutMS: 10000,
  serverSelectionTimeoutMS: 15000,
};

// Use a global variable to preserve the MongoDB client across serverless lambda invocations and HMR
const globalWithMongo = global as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
  _indexesCreated?: boolean;
};

export default function getMongoClient(): Promise<MongoClient> {
  if (!globalWithMongo._mongoClientPromise) {
    const client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client
      .connect()
      .then(async (c) => {
        // Asynchronously ensure high-performance database indexes in background
        if (!globalWithMongo._indexesCreated) {
          globalWithMongo._indexesCreated = true;
          try {
            const db = c.db();
            await Promise.all([
              db
                .collection("users")
                .createIndex(
                  { normalizedEmail: 1 },
                  {
                    unique: true,
                    partialFilterExpression: {
                      normalizedEmail: { $type: "string" },
                    },
                  },
                ),
              db
                .collection("accounts")
                .createIndex(
                  { provider: 1, providerAccountId: 1 },
                  { unique: true },
                ),
              db
                .collection("auth_tokens")
                .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
              db
                .collection("rate_limits")
                .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
              db
                .collection("realtime_events")
                .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
              db.collection("jobs").createIndex({ status: 1, availableAt: 1 }),
              db
                .collection("jobs")
                .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
              db
                .collection("offline_receipts")
                .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
              db.collection("events").createIndex({ slug: 1 }),
              db.collection("events").createIndex({ uniqueSlug: 1 }),
              db.collection("events").createIndex({ workspaceId: 1 }),
              db.collection("guests").createIndex({ eventId: 1, status: 1 }),
              db.collection("guests").createIndex({ eventId: 1, qrCodeId: 1 }),
              db.collection("guests").createIndex({ eventId: 1, email: 1 }),
              db
                .collection("event_notifications")
                .createIndex({ eventId: 1, createdAt: -1 }),
              db
                .collection("event_notifications")
                .createIndex({ eventId: 1, read: 1 }),
              db
                .collection("registration_submissions")
                .createIndex({ eventId: 1, status: 1 }),
              db.collection("qr_codes").createIndex({ eventId: 1 }),
              db.collection("qr_codes").createIndex({ shortId: 1 }),
              db.collection("memberships").createIndex({ userId: 1 }),
              db.collection("memberships").createIndex({ workspaceId: 1 }),
              db.collection("event_settings").createIndex({ eventId: 1 }),
              db
                .collection("notification_settings")
                .createIndex({ eventId: 1 }),
            ]);
          } catch (error) {
            globalWithMongo._indexesCreated = false;
            await c.close();
            throw new Error(
              "Required database indexes could not be created. Review duplicate accounts and database permissions.",
              { cause: error },
            );
          }
        }
        return c;
      })
      .catch(async (error) => {
        // A transient startup failure must not poison every later request.
        globalWithMongo._mongoClientPromise = undefined;
        globalWithMongo._indexesCreated = false;
        await client.close().catch(() => {});
        throw error;
      });
  }
  return globalWithMongo._mongoClientPromise;
}
