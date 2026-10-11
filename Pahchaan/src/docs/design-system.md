# Pahchaan design system

Pahchaan uses an original event-focused interpretation of the company's [DishaYug reference](https://disha-yug.vercel.app/) and its [repository](https://github.com/bharat-vicky/disha-yug). The reference was inspected visually and its styles were read; its application code and content were not imported into the product.

## Palette

| Role | Color | Purpose |
| --- | --- | --- |
| Warm ivory | `#fcfcf7` | Page background and breathing room |
| Deep forest | `#173c34` | Headings and primary text |
| Forest green | `#184b3f` | Primary buttons, logo, navigation and major sections |
| Sage | `#eef1e5` | Secondary surfaces and quiet emphasis |
| Peach | `#fa956a` | Logo detail and small editorial accents |
| Warm border | `#dce2d6` | Cards, forms and dividers |
| Muted green | `#627068` | Supporting text |

DM Sans is the interface typeface. DM Serif Display adds occasional editorial emphasis to public headings and dashboard titles. Geist Mono remains for technical values. Fonts are optimized and self-hosted through Next.js.

Use rounded cards, thin warm borders, restrained shadows, generous spacing, clear visual hierarchy, and readable control sizes. Keep meaningful status colors for errors, warnings and admission results. Do not force brand colors onto customer-designed QR codes or existing event branding.

## Implementation

- Shared theme tokens and neutral utility shades: `src/app/globals.css`.
- Landing, authentication and shell treatments: `src/app/pahchaan.css`.
- Shared logo: `src/components/Brand.tsx` and `public/pahchaan.svg`.
- Browser and touch icons are derived from the same SVG mark.
- Landing composition: `src/features/landing/components/PahchaanLanding.tsx`.
- Authentication preserves the existing login, signup, verification and recovery actions.
- DashboardShell preserves workspace selection, navigation, permissions and sign-out behaviour.
- Charts use valid CSS color variables and the brand palette; exports and report titles use Pahchaan.
- Product URLs use the configured application origin, rather than inventing a new production domain.

The site contains no pricing section, subscription cards, payment amounts, or payment offers in its metadata. The former settings URL redirects to general settings to preserve old bookmarks. Existing database names, encryption derivation, API-key protocols and browser storage keys are retained for compatibility; these internal identifiers are not product branding.

## Accessibility and responsiveness

Public navigation adapts to phone widths. The event journey supports arrow keys, Home and End, correct tab relationships and selected states. FAQs use native details/summary controls. Focus indicators, a skip link and reduced-motion rules are included. User-facing preview event data is explicitly illustrative.

The production regression suite verifies the Pahchaan title, absence of payment and old brand copy, journey interactions, FAQ opening, mobile menu operation and no horizontal overflow at 390px, followed by existing login, form-builder, workspace switching and signup verification checks.

Screenshots and test evidence are saved in `docs/test-results/`. Production build, TypeScript and lint are also checked. No public deployment was performed.
