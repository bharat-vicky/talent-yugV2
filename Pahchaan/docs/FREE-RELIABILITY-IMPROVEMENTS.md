# Reliability improvements without additional subscriptions

## Delivery

Account verification, recovery and registration OTP emails have priority 100; invitations have priority 0. Queued verification messages stop being eligible when their original code/link expires. Existing queued messages retain their original priority.

Email provider quota errors retry hourly, up to 30 attempts. Other transient email failures retry with capped exponential backoff. Permanent SMTP rejections and authentication failures terminate immediately. Non-email jobs retain five attempts. SMTP acceptance does not guarantee inbox delivery or exactly-once delivery after an ambiguous connection failure.

The worker drains busy batches promptly, polls empty queues every five seconds, and reports queue age and failed jobs in its private response at most once per minute. Coolify worker logs warn when pending work is older than two minutes or jobs have failed during the last day. This is diagnostic monitoring; external notifications are not configured.

## Lists and database load

Guests and registration responses use pages of 50, capped at 100 through their APIs. Registration responses retain the array response format; totals are provided through X-Total-Count and X-Total-Pages headers. Guest selection clears when changing page/filter; selected CSV export applies to selected guests on the current page. Sorting includes _id for deterministic order when timestamps match. Pagination is offset based, so additions/deletions between requests can shift page boundaries.

Guest search is debounced 350ms. Guest, realtime and notification polling intervals are 15 seconds. Guest/notification polling pauses in hidden tabs; focus and user mutations refresh promptly. Compound indexes support list sorting and queue diagnostics.

## Abuse protection behind the current proxy

Individual email allowances are unchanged. Individual rejection happens before the shared bucket so repeatedly rejected email requests cannot exhaust everybody's shared allowance. When real client addresses are unavailable, the shared fallback permits at least 500 requests per scope per ten minutes (or limit * 10 when larger), rather than 50 for email-send scopes. This is still a deployment-wide safeguard and can still be exhausted. Forwarded headers remain untrusted until the complete Coolify proxy chain has been verified; do not blindly enable TRUST_PROXY.

## Work requiring a separate operational setup

No paid provider, cloud account or higher server/database tier was created. Gmail's sending quota remains unchanged. Off-server encrypted backups and external uptime notifications require choosing a destination/operator; they are not enabled by this patch. Schedule backups during a write-free maintenance window if using a logical export without snapshot consistency, and verify restoration in an isolated database. Keep backup archives and encryption credentials outside Git.

Offline scans remain provisional until synchronized. No retention policy was added for attendee history, and no attendee data is deleted by these changes. No benchmark-derived throughput guarantee is claimed.
