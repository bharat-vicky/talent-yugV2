# TalentYug + Pahchaan on Coolify

This repository deploys one website with two isolated applications:

- `/`: TalentYug marketing site, exported by Next.js and served by Nginx.
- `/pahchaan`: Pahchaan's Next.js server, including its own styles, authentication,
  registration forms, QR tools, APIs and MongoDB data.
- `worker`: continuously processes Pahchaan's queued email, SMS and webhook jobs.

The two applications retain separate package manifests and lockfiles. This avoids
mixing incompatible React/Next.js versions, CSS, and providers. Navigation between
them is a normal page navigation. Pahchaan's own navigation remains client-side.

## Coolify application settings

1. Use a **Docker Compose** application from this Git repository (not Nixpacks or
   a static-site build). Commit the `Pahchaan/` source folder alongside TalentYug.
2. Base directory: `/`. Compose file: `/docker-compose.yaml`.
3. Assign your HTTPS website domain to **gateway**, container port **80**.
   Do not assign public domains or host port mappings to `pahchaan` or `worker`.
4. Add the environment variables below in Coolify, then deploy. Coolify terminates
   HTTPS and forwards the domain to Nginx, which routes `/pahchaan` internally.
5. The same domain must be used in both public URL variables. For example, if the
   domain is `https://talentyug.in`, use the values shown below. Replace it with
   your actual deployment domain if different. No trailing slash is needed.

See Coolify's [Compose application settings](https://coolify.io/docs/applications/configuration/general)
and [environment-variable documentation](https://coolify.io/docs/applications/configuration/environment-variables).

## Environment variables to add

```dotenv
NEXT_PUBLIC_APP_URL=https://talentyug.in/pahchaan
NEXTAUTH_URL=https://talentyug.in/pahchaan/api/auth
MONGODB_URI=mongodb+srv://USER:PASSWORD@CLUSTER/pahchaan?retryWrites=true&w=majority
AUTH_SECRET=YOUR_EXISTING_AUTH_SECRET_OR_A_NEW_RANDOM_SECRET
JOB_WORKER_SECRET=YOUR_EXISTING_WORKER_SECRET_OR_A_NEW_INDEPENDENT_RANDOM_SECRET
JOB_ENCRYPTION_KEY=YOUR_EXISTING_KEY_OR_A_NEW_BASE64_ENCODED_32_BYTE_KEY

SMTP_HOST=YOUR_SMTP_HOST
SMTP_PORT=587
SMTP_USER=YOUR_SMTP_USERNAME
SMTP_PASS=YOUR_SMTP_PASSWORD
SMTP_FROM=TalentYug <YOUR_VERIFIED_SENDER_ADDRESS>
```

`NEXT_PUBLIC_APP_URL` is a **build-time and runtime** variable: Compose explicitly
passes it into the Pahchaan image build. Redeploy/rebuild after changing the domain.
All secrets are runtime-only; do not mark them as Docker build arguments.
`NEXTAUTH_URL_INTERNAL` is already set in Compose to the internal authentication
endpoint. Do not override it with the public URL.

The database must be a **MongoDB replica set or Atlas cluster**, with a database
name in the URI. A standalone MongoDB server does not support the application's
transactions. The provided stack uses your separately managed database, not an
ephemeral database inside the application container. Allow the Coolify server
network to access it and keep backups. Reuse the original database URI if you
want to retain existing Pahchaan accounts and events.

SMTP is needed for password-account verification, recovery, invitations and email
delivery. The worker is included in Compose, so no separate cron is needed.
Google login can work without password verification emails; it does not replace
SMTP for other email features. `TRUST_PROXY=false` is fixed in Compose to avoid
trusting a client-supplied IP chain; rate limiting still works with a shared IP
bucket. Review your proxy trust configuration before enabling per-IP trust.

For a new installation, generate three separate random values. For example, run
`openssl rand -base64 32` separately for each secret. **For an existing installation,
preserve its auth secret and encryption key**. Changing the encryption key makes
existing queued payloads unreadable. If the old deployment did not set
`JOB_ENCRYPTION_KEY`, drain its queue before enabling a new independent key; its
legacy key was derived from the auth secret. `NEXTAUTH_SECRET`, if set in the old
deployment, took precedence over `AUTH_SECRET`; use that effective value here.

Optional Google sign-in:

```dotenv
AUTH_GOOGLE_ID=YOUR_GOOGLE_OAUTH_CLIENT_ID
AUTH_GOOGLE_SECRET=YOUR_GOOGLE_OAUTH_CLIENT_SECRET
```

Register this exact authorized redirect URI in Google Cloud:
`https://talentyug.in/pahchaan/api/auth/callback/google` (substitute your domain).
Use `https://talentyug.in` as the authorized JavaScript origin.

### Google sign-in during local development

In Google Cloud / Google Auth Platform / Clients, open the **Web application**
OAuth client whose client ID matches the one used by the app. Add this exact
**Authorized redirect URI** (no trailing slash):

```text
http://localhost:3000/pahchaan/api/auth/callback/google
```

Keep the production callback registered as well. If configuring Authorized
JavaScript origins, the local origin is `http://localhost:3000` (no path).
Open the local app at `http://localhost:3000/pahchaan/login` consistently so
OAuth cookies are set on the same hostname used by the callback. Do not switch
between `127.0.0.1` and `localhost` during sign-in.

The combined development launcher deliberately uses local URLs even when the
environment file contains production URLs. Adding client keys to `.env.local`
does not register callback URLs with Google. A `redirect_uri_mismatch` error
must be resolved in the matching OAuth client's redirect allowlist; changing
the client secret does not fix it. The running app's public provider metadata at
`/pahchaan/api/auth/providers` shows the callback URL it is using.

The app accepts both `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` and
`AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`. The `GOOGLE_CLIENT_*` names take
precedence when both are set; avoid configuring conflicting pairs.

Optional SMS:

```dotenv
TWILIO_ACCOUNT_SID=YOUR_ACCOUNT_SID
TWILIO_AUTH_TOKEN=YOUR_AUTH_TOKEN
TWILIO_FROM=YOUR_TWILIO_SENDER
```

## Deployment checks

- `/` opens TalentYug; **Explore Pahchaan** opens `/pahchaan` on the same domain.
- `/pahchaan/login` and `/pahchaan/signup` display Pahchaan, with its assets loaded.
- `/pahchaan/api/health` returns `{"status":"ready"}` when the database supports
  transactions. Check the `pahchaan` service logs if it stays unhealthy.
- Signing in returns to `/pahchaan/dashboard`, not TalentYug's root.
- Verification, reset, invitation and shared registration links include `/pahchaan`.
- Queued email jobs are processed by `worker`; verify receipt using your SMTP account.
- Public access to `/pahchaan/api/internal/jobs` and debug endpoints is blocked at
  Nginx; the worker uses the private network and a bearer secret.

The previous Sites-hosted static URL cannot run this MongoDB application. This
integration is prepared for **Coolify**; deploying only `out/` would leave the new
card pointing to a missing application. No live Coolify changes are made by editing
this repository.

## Existing data and links

There is no collection rename, account migration, or automatic data deletion.
Previously stored `/api/files/...` upload URLs redirect to the protected subpath.
Links already sent from a separate old Pahchaan domain need redirects on that old
host to the matching `/pahchaan/...` paths. Keep the old domain while those links
or printed QR codes are in use; changing this repository alone cannot update them.

The imported folder originally had its own `.git` directory. It is preserved
locally at `tmp/pahchaan-original-git` (ignored), so the parent repository can track
the actual Pahchaan source instead of an unconfigured Git submodule. Secrets,
dependencies, database binaries and generated output remain ignored.

## Local development and validation

Use Node.js 24. Run `npm ci` in the root and `npm ci --prefix Pahchaan`. Copy
the root `.env.example` to `.env.local`, fill in development credentials,
then run `npm run dev` (`dev:all` is an alias). The launcher loads root environment
files for both apps and automatically uses local authentication URLs. Existing
shell variables take precedence; `Pahchaan/.env.local` supplies any settings not
provided by the shell or root files. Restart after changing environment variables.
Visit `http://localhost:3000` and
`http://localhost:3000/pahchaan`. Ports 3001 and 3002 are internal dev servers.
The combined launcher uses Webpack for Pahchaan development to avoid a reproduced
Turbopack hot-reload loop. Production builds and the Coolify configuration are
unchanged.

```sh
npm run build:all
npm run test:integration
npm --prefix Pahchaan run test:production
```

The production test suite uses a disposable MongoDB replica set and overrides
production credentials. It does not use your deployment database or send email.
Docker image execution additionally requires a running Docker engine.
