# Phase 1 verification

2026-10-19. Implemented in the existing isolated checkout on `codex/talarama-phase-0`, starting from verified `1b931fe`. Original approved design and roadmap are unchanged. No work was implemented in the original checkout; nothing was pushed, merged or deployed.

## Delivered scope

- Separate normalized external/local movie identity; preserved local IDs and readable legacy metadata. TMDB scores remain separate from member ratings.
- Additive nullable TMDB identity, refresh timestamp, backdrop, compact credits and score metadata; missing release year/runtime supported. Unique TMDB identity replaces descriptive title/year uniqueness without deleting or merging rows.
- Fixed-origin server-only validated TMDB search, discovery and detail transport, bounded inputs/pages/body size, five-second connection/body deadline, safe errors, non-adult filtering including direct details, trusted raster artwork and existing local fallbacks.
- Bounded process cache plus Next shared caching of **validated normalized results**, at 5 minutes/1 hour/24 hours. No member state enters metadata caching.
- Race-safe idempotent internal import service, safe refresh, dry-run matching, explicit reviewed mapping manifest, transactional conflicts/rollback and durable before/after mapping audits with exclusive audit journals.
- Operational documentation and placeholder-only environment configuration. Phase 2 screens, TMDB routes, link helper and import-first authenticated action wiring remain out of scope. No public import endpoint was added; callers must authenticate before using the internal import primitive.

## Measured verification

| Check | Result |
| --- | --- |
| Clean `npm ci` | Passed: 632 installed packages, 633 audited; no force flags |
| `npx prisma generate` | Passed, matching Prisma/client 6.19.3 |
| `npm run lint` | Passed, no warnings/errors |
| `npm run typecheck` | Passed |
| `npm test` | Passed: 49 tests in 16 files |
| `npm run test:integration` | Passed: 11 tests in 2 files |
| `npm run test:migrations` | Passed: all 25 migrations; no schema drift |
| `npm run test:e2e` | Passed: all 8 Chromium journeys on final rerun (30.0 s) |
| `npm run build` | Passed, production compilation and page generation |
| `npm audit` / `npm audit --omit=dev` | Both zero vulnerabilities |
| Independent read-only review | One P2 cache issue reproduced and fixed; follow-up found no new actionable defects |
| Approved design/roadmap diff | Unchanged |

Unit/provider tests include missing/invalid metadata, safe image paths, adult list/direct filtering, input/response limits, error statuses, credentials restricted to headers, connection and stalled-body timeout, process cache expiry/coalescing/failure eviction, matching ambiguity and operational guards. A real Next `IncrementalCache`/filesystem memory handler test independently verifies cross-instance normalized-result caching, key separation by TMDB ID, 24-hour expiry and malformed-response recovery. This complements the controlled cache-boundary regression test.

Database tests replay historical SQL, seed old movies/accounts/reviews/favorites/watchlists/genres **before** the new SQL, then compare IDs and values afterward and after a real `pg_dump`/`psql` restore into a second isolated schema. Eight simultaneous imports converge on one local movie. Different TMDB IDs sharing title/year remain distinct from one another and from an unmatched legacy movie. Provider failure leaves existing snapshots unchanged and creates no failed-import row. Reviewed mapping tests cover stale/conflicting batch rollback, durable audits, repeated mappings and retained associations. Actual CLI subprocess tests use fixture transport and guarded disposable schema URLs, verifying no-write matching, refusal to overwrite an audit file, successful reviewed apply and PREPARED/COMMITTED audit journals.

The development catalog is empty: its actual dry-run command succeeded with zero rows, without a live TMDB call. Fixture reports and applies exercise populated matching cases only on disposable test schemas. No ambiguous or production mapping was applied.

## Review and local migration findings

The independent reviewer found that Next raw-fetch caching could retain a malformed HTTP 200 before validation. The regression failed with the former transport settings, then passed after switching transport to `no-store` and placing Next caching around validated results in `server.ts`. The reviewer confirmed the fix; the subsequent real Next cache test covers framework behavior as well.

The local scratch development database had phase-0 tables but no applied migration history. Prisma deploy correctly refused to treat it as empty. An exact schema diff against committed `1b931fe` passed; an ignored PostgreSQL backup was saved under `.superpowers/phase1-pre-migration-dev.sql`; the 24 matching historical migrations were explicitly baselined, then phase 1 deployed without a reset. This concerns only the loopback disposable development cluster. No production reconciliation was attempted. The migration supports both the historical unique-constraint form and Prisma-created standalone title/year index form.

Final checks caught a nullable-year access in local search; a failing regression reproduced the crash and the null-safe fix now passes. Existing readers render unknown runtime/year instead of dereferencing missing data. The pre-existing ESLint peer-metadata warnings and harmless Node color-environment warnings remain documented; neither audit has findings. Both browser runs logged a Next response-stream cancellation during navigation while all journeys passed. This is retained as a runtime-log limitation; the suite does not establish a console-error-free browser session.

## External blockers and release limits

No TMDB environment variable/token is configured. Live search, detail availability and real-token import are **unverified**; provider contracts are exercised with synthetic fixtures. Configure `TMDB_READ_TOKEN` and perform an explicit real-token smoke check before claiming live catalog acceptance. No credentials were printed or invented.

Google OAuth credentials remain unavailable as established in phase 0. Browser journeys use synthetic sessions and do not prove real Google sign-in. No request was made for nonexistent old credentials. Production data preservation still requires a restored staging copy and reviewed migration evidence for that actual environment.

See [catalog operations](catalog-operations.md) for setup, reviewed matching/apply, durable audit recovery and backup/restore guidance, and the [execution plan](superpowers/plans/2026-10-19-phase-1-execution.md) for task scope.
