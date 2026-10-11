

async function run() {
  const { MongoClient } = await import("mongodb");
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/identity_db";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const guest = await db.collection("guests").findOne({});
    console.log("Guest:", guest);

    const qrCode = await db.collection("qr_codes").findOne({});
    console.log("QR Code:", qrCode);

    const workspace = await db.collection("workspaces").findOne({});
    console.log("Workspace ID type:", typeof workspace._id, workspace._id);
  } finally {
    await client.close();
  }
}
run().catch(console.error);
