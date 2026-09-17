This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Environment variables

Copy `.env.local` and fill in real values. Everything is optional at build time (the app has no statically generated page that touches Supabase), but required at runtime for the app to actually work:

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase client (browser + server, RLS-scoped).
- `SUPABASE_SERVICE_ROLE_KEY` — admin client, used only in server actions that must bypass RLS (storage uploads, staff-initiated loyalty redemption, etc).
- `DATABASE_URL` — direct Postgres connection used by `scripts/migrate.ts`.
- `NEXT_PUBLIC_SITE_URL` — base URL used to generate table QR codes; must be the real production domain before printing any QR.
- `OPENROUTER_API_KEY` — loyalty receipt OCR (`lib/ocr/extract-receipt-amount.ts`).
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — rate limiting (`lib/rate-limit.ts`). Without these, public write endpoints fail-open (no rate limiting) instead of blocking traffic.
- `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` — error monitoring (server/edge and browser respectively). Without a DSN, the Sentry SDK is a no-op — nothing is sent, nothing breaks.

## Error monitoring (Sentry)

`@sentry/nextjs` is installed and wired into `app/error.tsx`, `app/global-error.tsx`, the public menu error boundary (`app/(public)/m/[branchSlug]/t/[qrToken]/error.tsx`), and server/edge errors via `instrumentation.ts` (`onRequestError`). To activate it in an environment, create a Sentry project and set `SENTRY_DSN` (server/edge) and `NEXT_PUBLIC_SENTRY_DSN` (browser) — both are the same DSN value.

This is a lean install: `next.config.ts` is **not** wrapped with `withSentryConfig`, so no source maps are uploaded and stack traces in Sentry will show minified code. If that becomes a problem, wrap the config and add `SENTRY_AUTH_TOKEN` plus your org/project slugs — see the [Sentry Next.js docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/).

## Backup strategy

The database is Supabase-managed Postgres. Supabase takes automatic daily backups on every project (retention depends on plan — Pro and above also offer Point-in-Time Recovery). No extra setup is required for this baseline; to restore, use **Supabase Dashboard → Database → Backups**.

For an additional manual/offsite backup (e.g. before a risky migration), dump the database directly using the existing `DATABASE_URL`:

```bash
pg_dump "$DATABASE_URL" -f backup-$(date +%Y%m%d).sql
```

Restore with `psql "$DATABASE_URL" -f backup-YYYYMMDD.sql` against a fresh database — never against the live one.

## End-to-end tests (Playwright)

`npm run test:e2e` runs 4 browser-driven tests against a running dev server (`playwright.config.ts` starts `npm run dev` automatically, or reuses one already running locally, e.g. on a different port via `PLAYWRIGHT_BASE_URL`): public reservation submission, QR menu browsing, admin login + reservation creation, and a partial loyalty receipt-upload test (see below).

Requirements (all read from `.env.local`, same as the app itself):

- A live Supabase project reachable via `DATABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` — the suite writes real rows (a test table/QR code, a test loyalty member/user) and never deletes them, so only run it against a dev/staging project, not production, if that matters to you.
- `scripts/e2e/reset-test-user-password.ts` resets the password of a pre-existing `human-owner@bab.local` staff account (owner role) to a fixed test password — run it once before the first `test:e2e` run, or whenever that account's password needs resetting. It does **not** create the account; it must already exist in Supabase Auth with an `owner`-role `profiles` row.
- `scripts/e2e/seed.ts` and `scripts/e2e/create-loyalty-session.ts` run automatically from the relevant spec's `test.beforeAll` — no manual step needed for those.

**Why the loyalty test is partial**: there is no dev-bypass for the Google OAuth loyalty sign-in flow. Instead of driving a real Google consent screen, `create-loyalty-session.ts` signs a test user in via `supabase-js` directly and captures the exact cookies `@supabase/ssr` writes, which the test then injects via `context.addCookies` before navigating — reaching the same authenticated state a real Google sign-in would produce. The uploaded receipt image is a synthetic 1x1 PNG (not a real receipt), so the OCR extraction result is intentionally not asserted; the test only checks that the upload completes and a toast (success or rejection) appears, not which one.

## Continuous Integration

`.github/workflows/ci.yml` runs on every push/PR to `main`: `npm ci`, `npm run lint`, `npm run build`, `npm test`. No repository secrets are required — the build has no static page that reads Supabase env vars, so it succeeds without them.
