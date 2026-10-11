

async function start() {
  const { MongoMemoryReplSet } = await import("mongodb-memory-server");
  const mongod = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: "wiredTiger" },
    instanceOpts: [{
      port: 27017,
      dbName: 'identity_db'
    }]
  });
  const uri = mongod.getUri();
  console.log(`MongoDB successfully started in-memory on ${uri}`);

  // Keep process alive
  setInterval(() => {}, 1000 * 60 * 60);
}

start().catch(err => {
  console.error(err);
  process.exit(1);
});
