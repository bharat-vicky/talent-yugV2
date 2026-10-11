# Pahchaan — Event Management Platform

A multi-tenant event application with public registration, guest management, QR design and scanning, workspace roles, and analytics. Upstream changes and SaaS hardening are integrated locally. Payments are deferred; production readiness requires the staging and operational checks in [the readiness report](docs/SAAS-READINESS-AUDIT.md).

## Stack

Next.js 16.4 App Router, React 19.3, TypeScript, Tailwind CSS v4, NextAuth 4.24, MongoDB native driver, TanStack Query/Table, Recharts, and QR scanning/design libraries. Server authentication and database operations use the Node runtime.

## Setup

Use Node.js 24 (minimum 22.13), MongoDB Atlas or a replica set, and SMTP for account verification and password recovery.

```sh
npm ci
```

Copy `.env.example` to `.env.local`. Set the MongoDB URI, canonical app URL, independent authentication and worker secrets, and a stable base64 32-byte job encryption key. Configure SMTP and optional Google/Twilio credentials. Never commit `.env.local`.

For an ephemeral development database, `node start-mongo.js` prints the replica-set URI. This database loses its contents when stopped and is not suitable for deployment.

```sh
npm run dev
```

Open [localhost:3000](http://localhost:3000). Signup requires email verification. Run the job worker to deliver verification messages; otherwise these messages remain queued.

## Delivery worker

Schedule authenticated `POST /api/internal/jobs` with `Authorization: Bearer <JOB_WORKER_SECRET>` through your infrastructure. Each invocation claims up to ten eligible jobs and records delivery/retry results. Workspace Integrations shows recent job states. Missing SMTP/SMS configuration causes recorded failure, not simulated success. Protect and retain the job encryption key when rotating authentication secrets.

Google OAuth requires the callback `https://<your-domain>/api/auth/callback/google`. Webhook endpoints must use public HTTPS on port 443 and recipients should deduplicate using `X-Identity-Delivery`. Webhooks and email/SMS delivery are at least once.

## Validation

```sh
npm run type-check
npm run lint
npm run test:readiness
npm run build
npm run test:production
npm run test:browser
npm audit --omit=dev --audit-level=high
```

Tests start an isolated temporary MongoDB replica set and do not load your environment file. Production/browser checks require the completed build. Browser checks use installed Google Chrome; CI installs Chrome with Playwright. Evidence is saved under `docs/test-results/`.

The application enforces tenant/event access checks, verification and reset token expiry, transaction-backed registration capacity and provisioning, bounded request validation, duplicate entry protection, offline replay receipts, and durable encrypted delivery jobs. Public upload/signature fields, automatic duplicate attendee updates, background bulk handlers, and CRM connectors are not complete. Payments remain disabled. See the report for compatibility and remaining launch work; test coverage is not a guarantee of production scale or external-provider operation.

## Deployment

Deploy from this repository root with the Node runtime. MongoDB transactions require a replica set. Set a canonical HTTPS app URL, configure the worker schedule and delivery providers, review legacy user/index conflicts on a database copy, regenerate legacy API keys, and rehearse backup restoration before a public rollout. The GitHub Actions workflow validates type checking, lint, readiness, production/browser behaviour and runtime dependencies.

## License

Copyright (c) 2026 Anupam. See [LICENSE](LICENSE).