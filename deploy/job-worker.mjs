import { setTimeout } from "node:timers/promises";

const endpoint = process.env.JOB_WORKER_URL;
const secret = process.env.JOB_WORKER_SECRET;
if (!endpoint || !secret || secret.length < 32) {
  throw new Error(
    "Set JOB_WORKER_URL and JOB_WORKER_SECRET (at least 32 characters)",
  );
}
let running = true;
let failures = 0;
let previousFailure = "";
const shutdown = new AbortController();
for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => {
    running = false;
    shutdown.abort();
  });
}
while (running) {
  let delay = 5000;
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(60000),
    });
    if (!response.ok) {
      failures++;
      delay = Math.min(60000, 5000 * 2 ** Math.min(failures, 4));
      const advised = Number(response.headers.get("retry-after"));
      if (Number.isFinite(advised) && advised > 0)
        delay = Math.max(delay, Math.min(60000, advised * 1000));
      const failure = `HTTP ${response.status}`;
      if (failure !== previousFailure)
        console.error(
          `Job runner unavailable (${failure}); retrying with backoff.`,
        );
      previousFailure = failure;
    } else {
      if (failures) console.log("Job runner connection restored.");
      const result = await response.json();
      if (result.health && (result.health.failedLastDay || result.health.oldestPendingSeconds > 120))
        console.warn("Delivery queue needs attention", result.health);
      // Drain a busy queue promptly, without busy polling an empty one.
      delay = result.processed >= 10 ? 1000 : 5000;
      failures = 0;
      previousFailure = "";
    }
  } catch (error) {
    failures++;
    delay = Math.min(60000, 5000 * 2 ** Math.min(failures, 4));
    if (previousFailure !== error.name)
      console.error("Job runner unavailable:", error.name);
    previousFailure = error.name;
  }
  if (running) {
    try {
      await setTimeout(delay, undefined, { signal: shutdown.signal });
    } catch (error) {
      if (error.name !== "AbortError") throw error;
    }
  }
}
