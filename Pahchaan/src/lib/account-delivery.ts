import { jobEncryptionKey } from "./job-encryption";
import { HttpError } from "./http";
import { authSecret } from "./auth-secret";

// Check before creating any account. Log field names only, never credentials.
export function assertAccountDeliveryConfigured() {
  const missing = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"].filter(
    (name) => !process.env[name],
  );
  if (!authSecret || authSecret.length < 32) missing.push("AUTH_SECRET");
  if (process.env.SMTP_HOST && !/^[a-zA-Z0-9.-]+$/.test(process.env.SMTP_HOST))
    missing.push("SMTP_HOST");
  const port = Number(process.env.SMTP_PORT || 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    missing.push("SMTP_PORT");
  if (
    process.env.NODE_ENV === "development" &&
    process.env.DEV_JOB_WORKER === "false"
  )
    missing.push("email worker disabled");
  if (
    !process.env.JOB_WORKER_SECRET ||
    process.env.JOB_WORKER_SECRET.length < 32
  )
    missing.push("JOB_WORKER_SECRET");
  try {
    jobEncryptionKey();
  } catch {
    missing.push("JOB_ENCRYPTION_KEY");
  }
  try {
    const url = new URL(
      process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "",
    );
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      throw new Error("Invalid app URL");
  } catch {
    missing.push("NEXTAUTH_URL");
  }
  if (missing.length) {
    console.error("Account email configuration invalid:", missing.join(", "));
    throw new HttpError(
      "Email signup and recovery are temporarily unavailable. Please use Google sign-in or contact support.",
      503,
    );
  }
}
