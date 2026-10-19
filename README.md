# Talarama

A movie review and diary application built with Next.js, React, NextAuth, Prisma and PostgreSQL.

## Development

Use Node 22 LTS (22.14 or newer) and npm 11. Install with `npm ci`, then run `npx prisma generate`.
Copy `.env.example` to `.env` and replace placeholders with **development** credentials. Real environment files are ignored. `DATABASE_URL` and `DIRECT_URL` must point at the same database; the latter bypasses any pooler. Prisma CLI reads `.env`; Next.js also reads `.env.local` but the Prisma CLI does not automatically use it.

For a brand-new empty development database, see [database setup and migration findings](docs/migrations.md) before running any migration command. Existing populated databases need a reviewed schema/history comparison and backup; do not reset them or replay historical migrations.

Run `npm run dev` and open http://localhost:3000. No TMDB token is required in phase 0.

For Google OAuth, create a development web client with origin `http://localhost:3000` and redirect URI `http://localhost:3000/api/auth/callback/google`. Set both Google variables and a random `NEXTAUTH_SECRET` (for example generated with `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`). Do not commit or share the output. Sign in with an existing linked Google account and confirm its existing diary remains; sign out and sign in again. Automated tests use synthetic sessions and do not prove real OAuth works.

## Checks

- `npm run lint` — direct ESLint.
- `npm run typecheck` — TypeScript without emitting application code.
- `npm test` — focused logic, component, hook and route regression tests.
- `npm run test:integration` — real database route journeys on a separate disposable database (see docs/migrations.md).
- `npm run test:e2e` — anonymous browser journeys against a local test server.
- `npm run build` — production compilation. Requires development database configuration for database-backed page rendering.

Read [phase-0 verification](docs/phase-0-verification.md) for the actual checks run and remaining limitations. The [approved roadmap](docs/superpowers/plans/2026-10-19-talarama-upgrade-roadmap.md) describes later phases; they are not implemented here.
