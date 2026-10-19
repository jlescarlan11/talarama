# Phase-0 verification

2026-10-19. Work is isolated on `codex/talarama-phase-0`. No production database or deployment was accessed. Original planning files were copied into the worktree before implementation and preserved unchanged.

## Changes

- Reproducible npm/Node setup, placeholder-only `.env.example`, direct ESLint, typecheck, Vitest, disposable PostgreSQL integration/migration checks, and Playwright browser tests.
- Correct diary submission field names and shared form/API validation. Required 1–5 integer ratings retained; omitted/empty reviews normalize to empty text. Invalid dates and malformed JSON return validation errors rather than uncaught failures.
- Anonymous diary visitors get a sign-in page. The edit page checks identity and ownership before querying/rendering an entry. Write handlers retain owner checks.
- Shared Prisma connections stay alive across requests. Raw diary/session/request logging and raw Prisma error logging removed from upgraded paths.
- Patched existing application majors; removed verified unused dependencies. See [dependency assessment](dependencies.md) for versions, upstream sources, remaining audit findings and support limits.
- Shared Tailwind/DaisyUI light/dark tokens, system typography, focus, skip navigation, 44px controls, reduced motion, reusable empty state, accessible rating/field labels, local poster fallback and mobile modal navigation. See [foundations](visual-foundations.md).

## Measured checks

Fresh final verification after the independent-review fix:

| Check | Result |
| --- | --- |
| npm ci | Passed; 587 packages installed from the lockfile |
| npx prisma generate | Passed; matching client/CLI 6.19.3 |
| npm run lint | Passed; zero warnings/errors |
| npm run typecheck | Passed |
| npm test | Passed: 21 tests in 7 files |
| npm run test:integration | Passed: 5 tests on isolated PostgreSQL schemas |
| npm run test:migrations | Passed: 24 historical migrations; no drift |
| npm run test:e2e | Passed: 7 Chromium journeys, including actual browser save/log/edit/delete and mobile resize |
| npm run build | Passed after fresh npm ci, final review fix and full tests |
| npm run check:env | Expected failure: only GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET missing |
| npm audit | 8 high findings across 2 underlying tooling issues; not clean |

Light/dark and 360/768/1440 screenshots were inspected. This verifies the upgraded foundations and current core journey, not every legacy screen or production configuration.

Earlier checks: baseline `npm ci`, Prisma 6.8.2 generation and production build succeeded before dependency upgrades. Regression tests reproduced the payload mismatch, throwing date validation, empty-carousel crash, per-request disconnect, private logging, malformed JSON response, and unprotected diary edit-page read before fixes. After updates: 21 unit tests, 5 PostgreSQL integration tests, direct lint and typecheck passed. All 24 historical migrations replayed on a new test database, and Prisma reported no schema difference. No migration SQL or Prisma schema was changed.

Database journeys use synthetic accounts, explicit test-database suffix guards and generated isolated schemas. They exercise favorites/watchlist, log/edit/delete, ownership, empty review persistence, and unchanged movie/user/account associations. The browser journey uses a locally signed synthetic JWT; it does not prove a Google exchange works.

## Configuration and release blockers

The owner confirmed the old Google credentials no longer exist. An ignored local `.env` now contains a generated development NextAuth secret and separate local development/test database URLs. Google values remain unset. `npm run check:env` explicitly fails with only those missing variable names. A new Google Cloud web OAuth client and consent configuration are needed to verify real sign-in at `/api/auth/callback/google`; no credentials were fabricated or exposed.

The dependency audit retains 8 high findings across two underlying tooling issues; see dependencies.md. Next 15's documented maintenance window reaches October 21, 2026. Plan a tested Next 16/tooling migration before public launch. No production readiness or real OAuth success is claimed.

## Review decisions and deferred work

Independent read-only review: no Critical findings; the one Important mobile-menu resize issue was reproduced by a failing browser test, fixed by closing the dialog on the desktop media transition, and verified green in the full 7-journey browser suite.

Deferred minors: the carousel does not respond immediately to a reduced-motion preference changed while open; pointer exit can clear the shared pause state while keyboard focus remains in the carousel. These do not affect the empty-carousel regression or initial reduced-motion preference check.

Rulings made during execution:

1. Execute directly under the owner's explicit phase-0 approval instead of reopening design review. Changes are reversible on the isolated branch.
2. Accept empty/omitted review, keep required rating and existing schema. Tightening text validation later would need a product decision; optional ratings remain phase 3.
3. Keep historical migrations/schema unchanged because replay exactly matches. Any observed production drift still requires staging evidence and a reviewed reconciliation.
4. Keep legacy username allocation for phase 4; new Google sign-ins with colliding email prefixes can still fail. Existing account associations are preserved.
5. Leave calendar/timezone normalization to phase 3; legacy cross-timezone boundary behavior remains.
6. Defer Next/Prisma major migrations and production reconciliation to separate work; costs are the documented support deadline/audit issues and the need for a reviewed staging migration before deployment.

## Local handoff

The isolated worktree's ignored development PostgreSQL cluster is at `.superpowers/postgres`, bound to loopback port 55439, with distinct fresh development and test databases. It contains no imported member records. It is left running so `npm run dev` can use the prepared `.env`. If it is stopped or the computer restarts, from this worktree run:

```powershell
& 'C:\Program Files\PostgreSQL\17\bin\pg_ctl.exe' -D .superpowers/postgres -l .superpowers/postgres.log -o '-h 127.0.0.1 -p 55439' start
```

This local scratch cluster is not the portable setup for other developers; follow README.md and `.env.example` with your own development PostgreSQL instance. The worktree, branch and ignored environment are retained. Nothing was pushed, merged or deployed.
