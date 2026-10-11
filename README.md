# TalentYug

A responsive Next.js website for TalentYug's campus-to-career business, with TypeScript, Redux Toolkit, accessible Radix/shadcn-style components, local imagery, and reduced-motion support.

Pahchaan is integrated at `/pahchaan` in the same repository and domain. See
[Coolify deployment and environment variables](docs/COOLIFY.md) for the combined
Docker Compose stack. `npm run dev` runs both applications locally
(`npm run dev:all` is an alias).
For Vercel, use the [Services deployment configuration](docs/VERCEL.md).

## Run locally

Use Node.js 22 or later.

```sh
npm ci
npm ci --prefix Pahchaan
npm run dev
```

The preview runs at http://localhost:3000, with Pahchaan at
http://localhost:3000/pahchaan. Put shared credentials in the root `.env.local`.
Shell variables take precedence over root environment files; Pahchaan's own
`.env.local` supplies any remaining settings. The launcher automatically uses
local authentication URLs. Restart after changing environment variables.
Use `npm run dev:marketing` only when working on the marketing site alone.

```sh
npm run typecheck
npm run build
```

The marketing site is exported to `out/`. The complete TalentYug + Pahchaan site
requires a server deployment using Vercel Services or the root Docker Compose
stack; a static host alone cannot run
Pahchaan's authenticated APIs, MongoDB transactions or background jobs.

## Structure

- `src/app` — page composition, metadata, and shared design tokens.
- `src/components` — website sections and accessible interactive components.
- `src/lib/content.ts` — business contact details, programme content, and FAQs.
- `src/lib/store.ts` — Redux store factory for audience selection and enquiry state; each provider owns its store.
- `public/images` — optimized local images.
- `.openai/hosting.json` — Sites identity and static output configuration.

## Enquiries

The form validates visitor details and prepares a `mailto:` draft addressed to `connect@talentyug.in`. Visitors review and send using their own email app. A copy-message fallback is available. The website does not submit messages automatically, persist personal details, or require a database. Form entries remain in memory while the page is open and are cleared on reload.

## Content sources

Programme inclusions come from `TalentYug_Campus_to_Company_Programme_Draft.docx`. College partnership and student participation pricing are shared through enquiries, with commercial details confirmed in a written proposal. Keep exact programme amounts out of public copy and bundled client data.

Early impact numbers come from page 6 of `Talantyug pitch.pdf`. They are presented as company-reported early traction, with placements and internships combined. Forecasts and investor revenue models are not presented as achieved results.

Contact details, founder identity/portrait, and social links were verified on https://www.talentyug.in and its about/companies pages on 12 September 2026. Conflicting street addresses are intentionally simplified to Bihar, India. The hero is generated illustrative photography, not a photograph of actual TalentYug students or staff. Original business documents are preserved locally and excluded from Git/public output.

The rotating founder showcase uses the three labelled portraits from slide 12 of `Presentation2.pptx`. The original team image is displayed through CSS portrait windows. It advances every five seconds while visible, pauses on hover or focus, and provides manual selection and pause controls. Reduced-motion preferences disable automatic rotation.

## Maintenance

Update programme facts and contact details in the content module and section components. Confirm pricing and traction before releasing public marketing updates. No authentication, checkout, analytics, or claimed placement guarantees are included.
