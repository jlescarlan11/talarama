# Phase 1 Catalog Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for native execution. Execution is already authorized by the owner; do not reopen approved design questions.

**Goal:** Add a validated TMDB boundary and safe, repeatable local catalog import while preserving existing data.

**Architecture:** Pure normalization and image functions feed a server-only fixed-origin provider client. Prisma import and reviewed mapping transactions own all writes; searching and inspecting never writes. Existing screens remain local readers.

**Tech Stack:** Existing Next 16, TypeScript, Zod, Prisma 6, PostgreSQL, Vitest, Playwright. Add only Next's `server-only` marker and the dev-only `tsx` CLI runner; no new framework.

**Spec:** `docs/superpowers/specs/2026-10-19-talarama-community-design.md`, phase 1 of the approved roadmap.

## Global Constraints

- Preserve Google accounts, local movie IDs, reviews, diary entries, favorites, and watchlists.
- No production database reset, automatic ambiguous catalog merges, or automatic publication of existing entries.
- Server-only TMDB read token; fixed endpoints, five-second timeout; search 300 seconds, discovery 3600 seconds, details 86400 seconds.
- No phase 2 screens/routes, production mapping, push, merge or deploy. Original approved documents remain unchanged.
- Nullable metadata means unknown, never fabricated zeroes; TMDB scores remain explicitly on a ten-point scale.

## Review Focus

- Adult direct details and malformed provider responses must fail before persistence.
- Same title/year and simultaneous imports must retain distinct external IDs and converge per TMDB ID.
- Conflicting/stale reviewed mappings must roll back the entire batch and leave an auditable record.
- Failed refresh, missing token, timeout and removed provider titles must preserve local snapshots.
- Legacy relationship fixtures must survive real SQL migration and logical backup/restore.

### Task 1: Provider contracts and boundary

**Files:** `app/lib/tmdb/{types,normalize,images,cache,client,server}.ts`, `tests/catalog/provider.test.ts`, `vitest.config.mts`, `next.config.ts`, `.env.example`.

**Interfaces:** `TmdbClient.search({query,year?,page?})`, `.discover({year?,genre?,page?})`, `.details(tmdbId)` return normalized metadata with `localId: null`, `tmdbId`, nullable metadata, trusted image URLs and `tmdbScore`. `TmdbError.code` provides safe errors. Cache holds validated metadata only, with bounded memory and pending-request coalescing; `server.ts` caches normalized results across Next requests. Raw fetch uses no-store following review finding.

- [x] Write fixture tests for identity, unknown metadata, image path rejection, adult filtering, input bounds, response validation, statuses, timeout, redirect rejection, cache expiry/coalescing/failure eviction and credentials staying in headers.
- [x] Run `npm test -- tests/catalog/provider.test.ts`; verify missing implementation fails.
- [x] Implement contracts, fixed-origin transport, bounded response streaming, TTL cache, and trusted TMDB image pattern while retaining existing artwork hosts.
- [x] Run provider tests and existing unit suite; expect all pass.

### Task 2: Additive schema and import

**Files:** `prisma/schema.prisma`, new phase-1 SQL migration, `app/services/movieImportService.ts`, nullable field readers, `tests/integration/catalog/catalog.test.ts`.

**Interfaces:** `importMovie(tmdbId, {db,provider})` returns persisted Movie, fetches trusted details only when absent, upserts by unique TMDB ID with race-safe nested genre upserts. `refreshMovie` fetches first and updates only on success. No HTTP action added in phase 1.

- [x] Write PostgreSQL fixtures for concurrent imports, same-title/year distinct movies, retry/failure, stale snapshots, nullable metadata and genre associations. Verify failing tests before implementation.
- [x] Add nullable unique tmdbId, metadataRefreshedAt, backdropUrl, credits JSON and tmdbScore fields; nullable year/runtime; drop title/year uniqueness only with tests proving distinct identities.
- [x] Implement import and refresh, then adapt current readers only for null compatibility and clear Unknown fallbacks.
- [x] Replay actual historical SQL before seeding a legacy relationship fixture, apply phase-1 SQL, compare IDs/values/links; logical export/restore to a second guarded schema and compare again. Run integration and migration suites.

### Task 3: Matching and reviewed apply

**Files:** `app/services/catalogMappingService.ts`, `scripts/catalog-{match,apply}.ts`, `scripts/catalog-runner.mjs`, `tests/catalog/mapping.test.ts`, integration catalog tests, `package.json`.

**Interfaces:** `matchCatalog` emits title/year candidate reports without writes; `applyMappings` accepts a versioned reviewed manifest with expected local title/year and explicit tmdbId, validates trusted details, atomically assigns identities without merging or overwriting legacy metadata. Transactionally stored audit rows capture before/after state; CLI exports that audit to an exclusive new file.

- [x] Write tests for ambiguous/unmatched suggestions, duplicate targets, stale identity, adult details, rollback, repeat application and persisted audit.
- [x] Verify failures, implement dry-run CLI and explicit reviewed apply with development/test database guard and audit output reserved before writes. No environment URLs printed.
- [x] Run catalog unit/integration tests; no production mapping is applied.

### Task 4: Verification and handoff

**Files:** `docs/phase-1-verification.md`, `docs/catalog-operations.md`, README/environment documentation.

- [x] Run generation, lint, types, unit, integration, migration replay, browser suite, production build, full/runtime audits. Read results and fix failures.
- [x] Inspect token presence without showing values; real-token smoke only if configured. Record missing live integration honestly.
- [x] Review final diff against phase-1 scope and preservation constraints. Document safe backup/restore and mapping workflow, results and blockers; preserve work in existing isolated checkout.
