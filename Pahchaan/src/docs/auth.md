# Authentication Architecture

Authentication is powered by **Auth.js (NextAuth)**.

- Configuration is centralized in `src/lib/auth.ts`.
- Supported Providers: **Google OAuth**.
- Adapter: `MongoDBAdapter` via `clientPromise`.
- Session Strategy: JWT.
- API Route exposed at `app/api/auth/[...nextauth]/route.ts`.
