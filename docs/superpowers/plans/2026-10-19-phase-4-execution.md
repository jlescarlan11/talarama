# Phase 4 Community Publication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking. Owner authorizes autonomous implementation and independent final review in the existing checkout.

**Goal:** Deliver deliberate public profiles, safe community activity and ratings, reporting/moderation, and durable mutation limits while preserving phases 1–3.

**Architecture:** Extend Prisma additively. Centralize all public eligibility and explicit serializers in uncached server services; use PostgreSQL atomic mutation buckets. Keep existing trusted metadata/import and diary retry contracts.

**Tech Stack:** Existing Next.js 16, React 19, Prisma 6/PostgreSQL 17, NextAuth 4, Zod, Vitest and Playwright.

**Spec:** `docs/superpowers/specs/2026-10-19-talarama-community-design.md`; phase 4 of the approved upgrade roadmap. Both approved files remain unchanged.

## Global Constraints

- Work exclusively in `C:/Users/jlesc/.codex/worktrees/talarama-phase-0/Talarama`, branch `codex/talarama-phase-0`, starting `e83b7c9`; preserve every prior commit and existing ID/account/link/value.
- Local only: no push, merge, PR publication, deployment, license change, reset, rebase or worktree removal.
- Existing profiles default unpublished; favorites default private. Public eligibility is published profile AND PUBLIC diary entry AND non-hidden moderation state.
- Handles lowercase 3–20 `[a-z0-9_]+`; reserve admin/api/me/settings/support. Bio maximum 300; reviews retain existing 0–2000; report reason maximum 500.
- Feed/review page size 20 ordered descending by `(createdAt,id)`. Community rating 1–5: newest eligible rated entry per member/movie, ties broken by ID.
- Shared PostgreSQL limits per member per ten minutes: diary 30, combined favorites/watchlist 60, reports 5. Atomic admission and bounded expired-row cleanup; HTTP 429 and Retry-After.
- Private/community routes are dynamic and no-store; visible public clients re-fetch after navigation/focus/privacy mutations. Metadata must not disclose hidden resources.
- Preserve all phase 3 calendar-date, legacy timestamp, idempotency, uncertain submission/draft recovery and watchlist cleanup semantics.
- No credentials printed or invented. Real TMDB/Google OAuth remain externally unverified absent newly configured credentials.

## Review Focus

- Already visited pages after profile/entry/moderation changes must discard stale public content and aggregates.
- Equal-time/deleted cursor boundaries must neither repeat nor skip eligible rows.
- Concurrent username allocation and mutation admission must rely on database conflicts/atomic SQL.
- Public payloads must exclude watched dates, emails, tokens, private counts, watchlists and hidden content.
- Populated historical migration/restore fixtures must preserve relationships and exact legacy timestamps; empty development data proves no production preservation.

### Task 1: Additive identity, moderation and limiter persistence

**Files:** `prisma/schema.prisma`, new `prisma/migrations/*phase4*/migration.sql`, `app/lib/profiles/contracts.ts`, `app/services/profileService.ts`, `app/services/usernameMigrationService.ts`, `scripts/username-preview.ts`, `scripts/set-admin.ts`, `app/auth/authOptions.ts`, `tests/profiles/*`, historical migration harness.

**Interfaces:** `profileSchema` strict allowlist (username, name, bio, timeZone, profilePublished, showFavorites); `updateProfile(userId,input,{db})`; `allocateUsername(userId,{db,candidate?})`; `previewUsernames(rows)`; `applyReviewedUsernames(manifest,{db})`. Persist report, moderation audit, username mapping audit, and mutation bucket records.

- [x] Write failing contract tests for normalization/reservations/lengths, role/identity injection, timezone validity, deterministic collision previews and reviewed stale mappings.
- [x] Run focused tests and record RED; implement strict contracts and transactional reviewed mappings without automatic legacy rewrites.
- [x] Add defaults/relations/indexes without altering legacy IDs/values; update historical fixture harness to apply phase4 only after seeding old rows; verify backup/restore equality.
- [x] Replace email-derived signup handles with neutral DB-conflict retries; refresh JWT/session display from persisted user by trusted ID; provide operator-only admin bootstrap.
- [x] Run tests, Prisma generation and typecheck; commit identity/persistence work locally.

### Task 2: Safe public reads and ratings

**Files:** `app/services/publicEntryService.ts`, `communityService.ts`, `communityRatingService.ts`, `app/api/community/route.ts`, `app/api/members/[username]/route.ts`, `app/api/reviews/[id]/route.ts`, `app/api/movies/[id]/reviews/route.ts`, `tests/integration/community.test.ts`.

**Interfaces:** `publicEligibility: Prisma.DiaryEntryWhereInput`; `listPublicEntries({cursor?,userId?,movieId?,textOnly?},{db}) -> {entries,nextCursor}`; `getPublicReview(id,{db})`; `getPublicProfile(username,{db})`; `communityRating(movieId,{db}) -> {average:number|null,count:number}`. Explicit DTOs include safe member identity/movie identity and creation timestamp, never private viewing date.

- [x] Write failing real-PostgreSQL tests covering master switch, private/hidden exclusion, explicit payload keys, optional favorites, tie pagination and deleted boundary.
- [x] Implement centralized filtering before selection/aggregation; newest eligible rated member/movie grouping ordered creation then ID.
- [x] Add no-store endpoints with generic missing responses; keep all retired unfiltered readers suppressed.
- [x] Verify rewatch/null/private/hidden/unpublished/deletion/tie rating transitions and public movie/detail integration; commit locally.

### Task 3: Shared mutation admission and audited moderation

**Files:** `app/lib/rateLimit.ts`, existing diary/library services and error handlers, `app/services/moderationService.ts`, report/admin APIs, `tests/integration/community.test.ts`.

**Interfaces:** `consumeMutation(userId,kind,{db,now?})`; `RateLimitError.retryAfter`; `reportEntry(reporterId,entryId,reason,{db})`; `moderateReport(adminId,reportId,{action:'hide'|'unhide'|'resolve'},{db})`; `listReports(adminId,{db})`.

- [x] Write failing concurrent bucket tests proving exact 30/60/5 admission and expiry, plus repeated create recovery at quota.
- [x] Implement atomic PostgreSQL upsert with conditional increment, DB clock and bounded expiry cleanup. Apply to diary and combined library writes, leaving idempotent create recovery before quota admission.
- [x] Write failing tests for duplicate reports, stale public eligibility, ordinary-member denial and role spoofing; implement admin DB authorization and transactional hide/unhide/resolve audit records.
- [x] Return 429 plus retry interval through existing draft-preserving clients; verify owner hidden entry remains readable; commit locally.

### Task 4: Publication, community and moderation UI

**Files:** profile settings/page/API; member/community/review pages; shared community cards, spoiler/report controls and refresh behavior; movie detail community section; admin queue; navbar; owner diary state; `tests/e2e/community.spec.ts`.

**Interfaces:** Clients consume only safe public DTOs, re-check uncached APIs on mount/navigation/focus/visibility and mutation events. Settings calls strict owner API and refreshes session. Public routes generic404 initially and remove stale data when eligibility disappears.

- [x] Write browser journeys for unpublished settings, publication/favorites, anonymous feed/profile/review, spoiler reveal, report uniqueness, admin hide/unhide/resolve and visited-page reversibility.
- [x] Implement accessible light/dark responsive screens with explicit readable widths, visible keyboard focus, native details/dialog semantics and useful rating-only/empty states.
- [x] Restore community ratings/reviews on shared movie details only through centralized public services; preserve metadata/provider caching separation.
- [x] Show hidden moderation state in owner's diary; explain profile publication master switch in entry form.
- [x] Verify Chromium journeys, 360/768/1440 screenshots and keyboard/reduced motion; commit locally.

### Task 5: Independent review, complete verification and operations

**Files:** `docs/phase-4-verification.md`, `docs/community-operations.md`, `docs/migrations.md`, plan progress/ledger.

- [x] Obtain independent whole-change review of security/privacy/concurrency/compatibility, approved design and this plan. Reproduce material findings RED→GREEN and document rulings.
- [x] Stop only owned browser/dev processes before Prisma generation. Run full unit/provider, PostgreSQL integration, migration replay/no drift, lint, typecheck, browser, build and full/runtime audits; inspect outputs and screenshots.
- [x] Back up guarded loopback dev DB before additive migration; preview existing handles and apply no ambiguous mapping. Record preserved counts/IDs and limitations, distinguishing fixtures from production evidence.
- [x] Document admin bootstrap, reviewed username changes, privacy semantics, quotas, rollback/restore and missing real credentials; leave clean local branch/worktree intact with final local commit.

## Execution ledger

- Preflight: clean `e83b7c9`; existing phase history verified. Owner's autonomous instruction overrides skill's optional plan approval pause. No new checkout required or authorized.
- Tasks 1–3: implemented as one coherent server/persistence commit because shared schema, safe HTTP errors, and publication services are interdependent. Missing-service integration RED observed (7 failures); shared-write limiter regression RED observed before integration; concurrent report uniqueness failure reproduced and fixed. Focused new database suite 10/10; complete integration 33/33; unit/provider 88/88; migration replay 27/no drift. Existing legacy timestamp/retry/watchlist tests preserved.
- Operator fixtures exercise no-write username preview, stale mapping rollback, exclusive audit refusal, reviewed apply with durable audit, preserved Google links, and guarded administrator bootstrap. Actual guarded development backup/deploy preserved eight empty legacy tables; username preview zero rows, no mappings applied. Empty dev evidence does not establish production preservation.
- Task 4: first browser run RED on missing settings/review screens; new journeys GREEN after implementation. Profile screenshots inspected at 360/768/1440, including light/dark and visible spoiler focus. The later final full-suite result is recorded below.
- Ruling: public member/review metadata uses generic titles and noindex in v1, avoiding retained personal metadata when a visited resource is unpublished. Cost if wrong: public journals will not be indexed until separately enabling indexing with suitable revalidation.
- Ruling: add opt-out `TALARAMA_DISABLE_COMPILER_CACHE=1` for compiler disk caching, used by disposable browser runs and constrained local build verification. A full browser run encountered ENOSPC; only direct files inside this worktree's verified generated Turbopack cache were cleared after the owned server exited. Cost if wrong: colder local compilation; no content or provider caching behavior changes.
- Independent read-only whole-change review: `e83b7c9..5ecd731`, fresh reviewer, no Critical or Minor findings; two Important findings; declined-to-judge list empty. No second reviewer dispatch.
- Final: fixed report draft loss on public revalidation — actual Chromium regression observed expected `Spam report`, received empty string before fix; page-owned drafts keyed by trusted member/entry survive content replacement. GREEN covers focus and a retained report after429.
- Final: fixed inaccessible reports beyond newest100 — real PostgreSQL fixture with106 reports failed missing nextCursor before fix; descending creation/ID pages now reach the oldest unresolved report. GREEN 11/11 new community integration tests. Resolved reports stay reachable for unhide actions.
- Discovery cold navigation: full browser run15/16 with one5000ms navigation assertion timeout; unchanged isolated diagnostic rerun passed. Allow15000ms for that exact route assertion under uncached compilation; no expected URL/behavior weakened. The final full rerun passed16/16, as recorded below.
- Final verification: unit/provider88/88, PostgreSQL34/34, Chromium16/16 (2.9min), screenshot-adjusted publication journey1/1, migration replay27/no drift, lint/types, Prisma6.19.3 generation after browser exit and production build13 static pages all passed. Both dependency audits0. New settings/profile screenshots inspected360/768/1440; corrected focused/scroll-offset capture artifact and rechecked mobile output.
- Tasks1–4 commits: `d7d0b33`, `5ecd731`, `0acb772`. Both review findings verified RED→GREEN; no deferred minors and no declined behaviors/rulings from review. Final operations/verification documentation committed separately. Keep original checkout, prior phases, this branch/worktree, PostgreSQL and backups intact under explicit owner instructions.
