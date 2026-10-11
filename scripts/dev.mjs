import http from "node:http";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createRequire } from "node:module";

// One browser origin, two independent Next.js runtimes. Production uses Nginx.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const { loadEnvConfig } = require("@next/env");
// Load shared credentials before starting either app. Shell variables take
// precedence, followed by the root .env files, then app-specific .env files.
loadEnvConfig(root, true);
const childEnv = { ...process.env };
// Each Next process must still load its own app-specific fallback variables.
delete childEnv.__NEXT_PROCESSED_ENV;
const port = Number(process.env.PORT || 3000);
const origin = `http://localhost:${port}`;
const apps = [
  { cwd: root, port: port + 1, env: {}, devArgs: [] },
  {
    cwd: path.join(root, "Pahchaan"),
    port: port + 2,
    // Pahchaan's Turbopack HMR repeatedly reloads the app in this combined
    // workspace. Use Next's supported Webpack dev server for stable editing.
    devArgs: ["--webpack"],
    env: {
      NEXT_PUBLIC_APP_URL: `${origin}/pahchaan`,
      NEXTAUTH_URL: `${origin}/pahchaan/api/auth`,
      NEXTAUTH_URL_INTERNAL: `http://127.0.0.1:${port + 2}/pahchaan/api/auth`,
    },
  },
];
const children = apps.map((app) =>
  spawn(
    process.execPath,
    [
      path.join(app.cwd, "node_modules/next/dist/bin/next"),
      "dev",
      ...app.devArgs,
      "-H",
      "127.0.0.1",
      "-p",
      String(app.port),
    ],
    {
      cwd: app.cwd,
      env: { ...childEnv, ...app.env },
      stdio: "inherit",
      windowsHide: true,
    },
  ),
);
// The same durable outbox worker used in production delivers account emails.
// Opt out when reviewing UI against a database whose jobs must not be sent.
if (process.env.DEV_JOB_WORKER !== "false" && (childEnv.JOB_WORKER_SECRET || "").length >= 32) {
  children.push(spawn(process.execPath, [path.join(root, "deploy/job-worker.mjs")], {
    cwd: root,
    env: { ...childEnv, JOB_WORKER_URL: `http://127.0.0.1:${port + 2}/pahchaan/api/internal/jobs` },
    stdio: "inherit", windowsHide: true,
  }));
} else {
  console.warn("Email worker disabled. Set JOB_WORKER_SECRET (32+ characters) to deliver account emails.");
}
const targetPort = (url) =>
  /^\/pahchaan(?:\/|\?|$)/.test(url || "/") ? port + 2 : port + 1;
const server = http.createServer((request, response) => {
  if (request.url?.startsWith("/api/files/")) {
    response.writeHead(307, { Location: `/pahchaan${request.url}` });
    response.end();
    return;
  }
  const upstream = http.request(
    {
      hostname: "127.0.0.1",
      port: targetPort(request.url),
      path: request.url,
      method: request.method,
      headers: { ...request.headers, "x-forwarded-proto": "http" },
    },
    (result) => {
      response.writeHead(result.statusCode || 502, result.headers);
      result.pipe(response);
    },
  );
  upstream.on("error", () => {
    if (!response.headersSent) response.writeHead(502);
    response.end("Applications are starting. Please refresh shortly.");
  });
  response.on("close", () => upstream.destroy());
  request.pipe(upstream);
});
server.on("upgrade", (request, socket, head) => {
  const upstream = http.request({
    hostname: "127.0.0.1",
    port: targetPort(request.url),
    path: request.url,
    headers: request.headers,
  });
  upstream.on("upgrade", (response, upstreamSocket, upstreamHead) => {
    socket.write(
      `HTTP/1.1 ${response.statusCode} ${response.statusMessage}\r\n${Object.entries(
        response.headers,
      )
        .map(([key, value]) => `${key}: ${value}`)
        .join("\r\n")}\r\n\r\n`,
    );
    if (head.length) upstreamSocket.write(head);
    if (upstreamHead.length) socket.write(upstreamHead);
    socket.pipe(upstreamSocket).pipe(socket);
    socket.on("error", () => upstreamSocket.destroy());
    upstreamSocket.on("error", () => socket.destroy());
  });
  upstream.on("error", () => socket.destroy());
  upstream.end();
});
function stop() {
  server.close();
  for (const child of children) child.kill();
}
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, stop);
for (const [index, child] of children.entries()) {
  const label = ["TalentYug", "Pahchaan", "Email worker"][index];
  child.on("error", (error) => {
    console.error(`${label} could not start: ${error.message}`);
    process.exitCode = 1;
    stop();
  });
  child.on("exit", (code) => {
    if (code) {
      console.error(`${label} stopped with exit code ${code}.`);
      process.exitCode = code;
    }
    stop();
  });
}
server.on("error", (error) => {
  console.error(error.message);
  stop();
  process.exitCode = 1;
});
server.listen(port, "127.0.0.1", () =>
  console.log(`Open TalentYug: ${origin}\nOpen Pahchaan: ${origin}/pahchaan\nUse port ${port} in your browser. Ports ${port + 1} and ${port + 2} below are internal servers.\nKeep this terminal open while using the site.`),
);
