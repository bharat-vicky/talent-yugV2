# Vercel deployment

Deploy the repository root with the **Services** framework preset. The root
`vercel.json` builds TalentYug and Pahchaan independently and routes `/pahchaan`,
its assets, and its APIs to Pahchaan. All other paths go to the marketing site.
Routing preserves the complete path required by Pahchaan's Next.js basePath.

Set credentials in the project's environment variables; both services share
them. Use the production domain for these public settings:

```env
NEXT_PUBLIC_APP_URL=https://talent-yug-v2.vercel.app/pahchaan
NEXTAUTH_URL=https://talent-yug-v2.vercel.app/pahchaan/api/auth
```

Do not set `NEXTAUTH_URL_INTERNAL` to localhost or a Docker service on Vercel.
Register the following authorized redirect URI in the Google OAuth client:
`https://talent-yug-v2.vercel.app/pahchaan/api/auth/callback/google`.

MongoDB, authentication, SMTP and job encryption credentials remain required
as described in `.env.example`. Never commit real environment files.

The Docker background mail worker is not started by Vercel. Until a serverless
delivery trigger or external worker is configured, queued email requires a
worker calling `/pahchaan/api/internal/jobs` with the job worker secret.

After deployment, check `/`, `/pahchaan`, `/pahchaan/login`, the login page's
assets, and `/pahchaan/api/auth/providers` on the production domain.
