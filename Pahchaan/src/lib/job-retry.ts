// Provider responses determine retryability; never log the raw SMTP response.
export function jobRetry(error: unknown, attempts: number, email: boolean) {
  const failure = error as { responseCode?: number; code?: string; response?: string; message?: string };
  const smtp = Number(failure?.responseCode || 0);
  const quota = email && /quota|daily.*limit|sending.*limit|too many messages|limit.*sending|rate.?limit|throttl/i.test(`${failure?.response || ""} ${failure?.message || ""}`);
  const permanent = email && !quota && (smtp >= 500 || failure?.code === "EAUTH");
  const maximum = email ? 30 : 5;
  return {
    failed: permanent || attempts >= maximum,
    delay: quota ? 60 * 60000 : email ? Math.min(3600000, 30000 * 2 ** Math.min(attempts - 1, 7)) : Math.min(3600000, 1000 * 2 ** attempts),
    reason: quota ? "Email provider sending limit reached" : permanent ? "Email provider rejected delivery" : "Temporary delivery failure",
  };
}
