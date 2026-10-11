
const uri = "mongodb://localhost:27017";

async function run() {
  const { MongoClient } = await import("mongodb");
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('identify_db'); // Is this the right db?
  // Check qr_scans
  const count = await db.collection("qr_scans").countDocuments();
  console.log("qr_scans count:", count);
  await client.close();
}
run();
