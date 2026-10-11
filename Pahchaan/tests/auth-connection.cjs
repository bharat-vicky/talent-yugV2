const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

test("Database initialization recovers after failure and shares successful connections", async () => {
  let attempts = 0,
    closed = 0;
  class MongoClient {
    async connect() {
      if (++attempts === 1) throw new Error("Temporary connection failure");
      return this;
    }
    db() {
      return { collection: () => ({ createIndex: async () => {} }) };
    }
    async close() {
      closed++;
    }
  }
  const source = fs.readFileSync(
    path.join(__dirname, "../src/infrastructure/db.ts"),
    "utf8",
  );
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const exports = {};
  new Function("require", "exports", "process", "global", compiled)(
    () => ({ MongoClient, ServerApiVersion: { v1: "1" } }),
    exports,
    { env: { MONGODB_URI: "mongodb://isolated-test" } },
    {},
  );
  await assert.rejects(exports.default(), /Temporary connection failure/);
  const [a, b] = await Promise.all([exports.default(), exports.default()]);
  assert.equal(a, b);
  assert.equal(attempts, 2);
  assert.equal(closed, 1);
});
