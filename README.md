# Talarama

A movie review and diary application built with Next.js, React, NextAuth, Prisma and PostgreSQL.

## Development

Use Node 22 LTS (22.14 or newer) and npm 11. Install with `npm ci`, then run `npx prisma generate`.
Copy `.env.example` to `.env` and replace placeholders with **development** credentials. Real environment files are ignored. `DATABASE_URL` and `DIRECT_URL` must point at the same database; the latter bypasses any pooler. Prisma CLI reads `.env`; Next.js also reads `.env.local` but the Prisma CLI does not automatically use it.

For a brand-new empty development database, see [database setup and migration findings](docs/migrations.md) before running any migration command. Existing populated databases need a reviewed schema/history comparison and backup; do not reset them or replay historical migrations.

Run `npm run dev` and open http://localhost:3000. Existing local content works without a TMDB token. Provider search/details/import require server-only `TMDB_READ_TOKEN`.

For Google OAuth, create a development web client with origin `http://localhost:3000` and redirect URI `http://localhost:3000/api/auth/callback/google`. Set both Google variables and a random `NEXTAUTH_SECRET` (for example generated with `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`). Do not commit or share the output. Sign in with an existing linked Google account and confirm its existing diary remains; sign out and sign in again. Automated tests use synthetic sessions and do not prove real OAuth works.

## Checks

- `npm run lint` — direct ESLint.
- `npm run typecheck` — TypeScript without emitting application code.
- `npm test` — focused logic, component, hook and route regression tests.
- `npm run test:integration` — real database route journeys on a separate disposable database (see docs/migrations.md).
- `npm run test:migrations` — replay all historical migrations in an isolated test schema and assert no schema drift.
- `npm run test:e2e` — anonymous/responsive discovery, synthetic-session import/save/log/edit/delete, provider failure and stale-search journeys. Run `npx playwright install chromium` once first. Requires `TEST_DATABASE_URL`; each run creates and removes its own schema. A test-only Node preload intercepts TMDB transport with synthetic data; it is never imported by application code and does not prove live TMDB or Google OAuth.
- `npm run check:env` — report missing configuration names without displaying values.
- `npm run build` — production compilation. Requires development database configuration for database-backed page rendering.

Read [phase-0 verification](docs/phase-0-verification.md), [phase-1 verification](docs/phase-1-verification.md) and [phase-2 verification](docs/phase-2-verification.md) for measured checks and limitations. [Catalog operations](docs/catalog-operations.md) covers provider configuration, additive migration, dry-run matching, explicit reviewed apply and recovery.

## Discovery and saving

`/movies` browses popular movies with genre/year filters; Search by title supports title and optional year. Mode, query, filters, popular sort and page are shareable URL state. Search updates after 300 ms; obsolete requests cannot replace current results. Provider metadata is read-only until a signed-in member explicitly saves or logs.

External and mapped cards use `/movies/tmdb/[tmdbId]`. Existing `/movies/[id]` links and unmatched local titles remain readable. If the provider fails, saved detail snapshots and local library actions remain available. Missing artwork/year/runtime/credits have fallbacks; TMDB's ten-point score is separate from current Talarama diary ratings on five points. The later community/privacy model is not part of phase 2.

Favorite/watchlist POST means **add**, DELETE means **remove**. Both are idempotent. External actions first call authenticated `POST /api/movies/import` with only `{ "tmdbId": 123 }`, then use the returned local movie ID. All personal action responses are `no-store`. Manual catalog creation/edit/deletion is retired for ordinary members; metadata operations use the trusted server provider workflow. No new schema migration is required for phase 2.
