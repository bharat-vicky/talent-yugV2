# TalentYug

A responsive Next.js website for TalentYug's campus-to-career business, with TypeScript, Redux Toolkit, accessible Radix/shadcn-style components, local imagery, and reduced-motion support.

## Run locally

Use Node.js 22 or later.

```sh
npm ci
npm run dev
```

The preview runs at http://127.0.0.1:3000.

```sh
npm run typecheck
npm run build
```

The production site is exported to `out/`. Serve that directory with any static host. `next start` is not used for static exports.

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

Programme inclusions and indicative pricing come from `TalentYug_Campus_to_Company_Programme_Draft.docx`: ₹1,00,000 per college **plus** ₹999 per participating student, across three months. Commercial details must be confirmed in a written proposal. The pitch uses different student-fee and success-fee assumptions, so the website discloses that final terms may include additional fees.

Early impact numbers come from page 6 of `Talantyug pitch.pdf`. They are presented as company-reported early traction, with placements and internships combined. Forecasts and investor revenue models are not presented as achieved results.

Contact details, founder identity/portrait, and social links were verified on https://www.talentyug.in and its about/companies pages on 12 September 2026. Conflicting street addresses are intentionally simplified to Bihar, India. The hero is generated illustrative photography, not a photograph of actual TalentYug students or staff. Original business documents are preserved locally and excluded from Git/public output.

## Maintenance

Update programme facts and contact details in the content module and section components. Confirm pricing and traction before releasing public marketing updates. No authentication, checkout, analytics, or claimed placement guarantees are included.
