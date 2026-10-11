# SaaS hardening and readiness — 9 October 2026

The reviewed upstream updates and the confirmed application fixes are implemented in the working tree. Payments and subscriptions are explicitly deferred at the owner's request. This is a tested staging foundation; production readiness still requires the deployment and operational checks below.

## Upstream and preservation

Compared local `b1facca` with upstream `e746bab` from [ANUPAM4545/Qr-code-identify](https://github.com/ANUPAM4545/Qr-code-identify). Applied the seven upstream commits' useful changes while retaining local configuration, providers, toast notifications, and the Next.js proxy migration. These include canonical user IDs, normalized emails, saved workspace selection, mobile workspace switching, event workspace fallback, and scan fixes. No branch reset, commit, push, or deployment was performed.

A snapshot of pre-integration local files is at `C:/Users/ASUS/.codex/visualizations/2026/10/09/01a11fa6-f802-7cd1-b100-25b0df4eb183/pre-upstream-backup/`. Database indexes are initialized by the application; existing users were not automatically merged or deleted. Back up production data before rollout.

## Implemented fixes

- Account security: bcrypt password validation, canonical email uniqueness, verified email before access, verified Google profiles and identity binding, expiring single-use verification/reset tokens, session invalidation after password reset, persistent rate limits, and explicit invitation acceptance. Missing secrets fail closed. Debug endpoints return 404.
- Workspace boundaries: permission checks and tenant/event checks for event, guest, registration review, QR, template, notification, member, API key, and webhook operations. Request bodies cannot overwrite tenant identity. Owner changes use a transaction and workspace lock to protect the final owner.
- Registration integrity: bounded JSON and form schemas, shared conditional rules, trusted hidden/read-only defaults, option/date/type checks, exact public event lookup, opening/closing windows, serialized capacity checks, idempotency keys, and transactional submission/guest/QR provisioning. Failure rolls back partial approval work.
- Admission: conditional updates prevent repeated and concurrent check-in; unassigned QR codes also track admission state. Offline scans are visibly queued without declaring admission successful. Replay receipts preserve the original result and avoid applying the same scan twice. Operator identity comes from the authenticated session.
- Delivery: MongoDB-backed email/SMS/webhook jobs with encrypted payloads, atomic claiming, renewable leases, bounded retries, crash recovery, and private status metadata. SMTP and Twilio delivery require configured providers and fail when unavailable. Webhooks have delivery IDs, HMAC signatures, pinned public DNS addresses, HTTPS-only destinations, private-address blocking, no redirects, and response/time limits. No simulated delivery success remains.
- Data: tenant-authorized private file downloads, persisted file bytes, size and content checks, event/workspace deletion cascades, queued event notification cleanup, and indexes for uniqueness and expiring records. Audit records are deliberately retained and need a documented retention policy.
- User experience: real persisted activity feeds replace mock live attendees; mobile workspace switching, form-builder rendering, public multiselect/default values, and QR preview refresh were repaired. Billing shows that payments are disabled. Placeholder CRM connection buttons were removed.
- Maintenance: Next.js 16.4, React 19.3, NextAuth 4.24.15, patched authentication/mail dependencies, current SheetJS distribution, supported Node requirements, reproducible isolated tests, and a CI validation workflow.

## Verification

| Check | Result |
| --- | --- |
| Final combined readiness, service, HTTP and Chrome browser suite | 134/134 passed |
| Next.js 16.4 production build | Passed; final compilation also checks TypeScript |
| ESLint | 0 errors; 145 warnings remain |
| Runtime dependency audit | 0 vulnerabilities |
| Full dependency audit | 5 high advisory entries in development lint dependencies |

Evidence: [final combined verification](test-results/pahchaan-all.json), [readiness](test-results/readiness.json), [production/browser results](test-results/platform.json), [lint](test-results/lint.json), [runtime audit](test-results/audit-production.json), [full audit](test-results/audit-all.json), [mobile screenshot](test-results/mobile-dashboard.png). `dependency-audit.json` is the earlier baseline, not the final result. The final combined run includes readiness, production HTTP and Chrome checks; earlier evidence files are retained for comparison.

Tests use a disposable MongoDB replica set, real repositories/services, and injected sessions for direct handlers. Production HTTP checks additionally use real credential sessions; browser checks use headless installed Chrome. These cover login, form-builder hydration, mobile navigation/workspace switching, and signup requiring verification. Security probes include cross-tenant IDs, malformed/chunked oversized JSON, single-use tokens, concurrent capacity/signup/retries, approval rollback, encrypted payload tampering, worker recovery, offline replay, and scoped deletion. No real email, SMS, OAuth provider, or webhook recipient was contacted. Concurrency probes are not a sustained load benchmark or independent penetration test.

The remaining dependency entries originate from [the braces nested-pattern advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) through the development lint dependency chain. The current audit suggests a breaking downgrade of `eslint-config-next`; this was not applied to a Next.js 16 project. Recheck for a compatible maintainer fix. Runtime audit and full audit are intentionally separate and CI audits runtime dependencies.

## Deployment requirements and compatibility

1. Use Node.js 24 (minimum supported 22.13) and MongoDB Atlas or a replica set. Standalone MongoDB cannot run the new transactions. `node start-mongo.js` starts an ephemeral local replica set for development; it is not persistent storage.
2. Copy `.env.example` to `.env.local` and set independent strong `AUTH_SECRET`, `JOB_WORKER_SECRET`, and a base64 32-byte `JOB_ENCRYPTION_KEY`. Keep the encryption key stable when rotating the authentication secret, or drain/migrate encrypted jobs first. Configure the canonical HTTPS app URL consistently for `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL`.
3. Configure SMTP before signup/invitation rollout. Schedule authenticated `POST /api/internal/jobs` with `Authorization: Bearer <JOB_WORKER_SECRET>`. Each invocation processes at most ten jobs within a bounded dispatch window. Check queue failures in workspace Integrations. Password verification and reset delivery depend on this worker.
4. Configure Google callback credentials and optional Twilio messaging. Verify both with controlled staging accounts. Configure a trusted proxy before enabling forwarded-IP handling; the proxy must overwrite user-supplied forwarding headers.
5. Inventory legacy users and required unique indexes on a database copy first. Ambiguous legacy email accounts fail closed; resolve identity conflicts explicitly. Old API keys hashed directly with bcrypt are invalidated and must be regenerated. Existing unverified password users need verification. Authentication changes may require users to sign in again.
6. Register webhook recipients that deduplicate by delivery ID. Delivery is at least once: a crash after sending but before recording completion can resend email/SMS/webhooks. Event deletion cancels queued jobs; a delivery already in flight cannot be recalled.
7. Run CI in the actual repository root, not an assumed `Identify/` subdirectory. The added GitHub Actions workflow has not been executed remotely during this session.

## Work that remains before public launch

- Configure and test live email verification/reset/invitations, Google OAuth, SMS and webhook delivery in staging, including retries, bounce/delivery failures and provider quotas. Hardware camera scanning and reconnect behaviour need a physical-device test.
- Perform a production-like traffic and capacity test, set infrastructure limits and monitoring, alert on failed jobs/index initialization, and rehearse database backup restoration and incident recovery. No 50,000-attendee scale claim has been verified.
- Complete a privacy/deletion and retention policy, audit-log retention implementation, and operational access review. Audit history intentionally survives event/workspace deletion. Stored job payloads expire after 30 days, scan receipts after 30 days, and realtime records after one hour.
- Public upload/image/signature form fields are disabled until a dedicated tenant-safe upload and malware scanning flow is built. Private authenticated storage exists, but is not a public upload integration.
- Duplicate registration policy `update` currently rejects a repeat and directs the attendee to the organizer, preventing unauthenticated overwrites. Implement authenticated attendee update links before advertising automatic update-by-email/phone.
- Background bulk import/export/approval/generation handlers are not provided by the generic worker. Existing bounded synchronous API operations remain; unconfigured worker types explicitly fail. CRM connectors, advanced API-key scopes and infrastructure-enforced tenant quotas need product design and implementation before they are advertised.
- Address the 145 nonblocking lint warnings and the development dependency advisory chain. Review legacy data compatibility on a copy before any production rollout.
- Payments, subscription plans and payment webhooks are deferred by explicit instruction.

These remaining items are not recorded as passed or silently substituted with mock integrations. All fixes are available for review locally; no production deployment has been performed.

## Pahchaan design update

The product is now branded Pahchaan, with the DishaYug reference palette, DM Sans / DM Serif Display typography, a new landing page and shared logo, updated dashboard/authentication styling, and renamed reports and QR downloads. Pricing, subscription and payment content have been removed from the site. The legacy settings URL redirects to general settings. Existing database and storage identifiers were preserved for compatibility. See [the design guide](../src/docs/design-system.md) and [design verification](test-results/pahchaan-verification.json).
