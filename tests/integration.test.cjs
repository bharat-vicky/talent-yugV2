const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("../Pahchaan/node_modules/typescript");
const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(
  path.join(root, "Pahchaan/src/lib/brand.ts"),
  "utf8",
);
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const exportsObject = {};
new Function("exports", "process", compiled)(exportsObject, {
  env: { NEXT_PUBLIC_APP_URL: "https://talentyug.example/pahchaan" },
});

test("Generated links retain the subpath exactly once, including query strings", () => {
  assert.equal(exportsObject.appUrl(), "https://talentyug.example/pahchaan/");
  assert.equal(
    exportsObject.appUrl("/r/campus?source=qr"),
    "https://talentyug.example/pahchaan/r/campus?source=qr",
  );
  assert.equal(
    exportsObject.appUrl("/pahchaan/r/campus"),
    "https://talentyug.example/pahchaan/r/campus",
  );
});

test("Browser API calls cannot escape the Pahchaan route", () => {
  const offenders = [];
  function visit(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (/\.tsx?$/.test(file) && entry.name !== "proxy.ts") {
        const content = fs.readFileSync(file, "utf8");
        if (/["'`]\/api(?:\/|["'`?])/.test(content))
          offenders.push(path.relative(root, file));
      }
    }
  }
  visit(path.join(root, "Pahchaan/src"));
  assert.deepEqual(offenders, []);
});

test("TalentYug card performs a full navigation into the other application", () => {
  const html = fs.readFileSync(path.join(root, "out/index.html"), "utf8");
  assert.match(html, /href="\/pahchaan"[^>]*>Explore Pahchaan/);
});
