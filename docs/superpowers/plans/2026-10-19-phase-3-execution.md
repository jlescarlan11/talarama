# Phase 3 Diary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Native implementation and one independent final review are already authorized; proceed without another approval pause.

**Goal:** Reliable private diary and personal library with calendar dates, optional ratings, retry-safe logging and preserved legacy data.

**Architecture:** One Zod contract and pure date helpers feed owner-scoped Prisma services and authenticated no-store handlers. One log form serves detail/create/edit flows. Metadata remains on the existing cached TMDB boundary; diary reads never enter shared caches.

**Tech Stack:** Existing Next 16, React, Zod, Prisma 6, PostgreSQL, Vitest, Playwright. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-19-talarama-community-design.md`, Subproject B of the approved roadmap.

## Global Constraints

- Existing isolated checkout and branch only; preserve phases 1/2, IDs/accounts/links and approved documents. All commits local; no push/merge/deploy/removal.
- Integer 1–5 or null; trimmed review 0–2000; actual YYYY-MM-DD at UTC midnight; validate future dates in saved IANA timezone with browser initialization/UTC fallback.
- Existing entries PRIVATE. PUBLIC records remain excluded from all public surfaces until phase 4 eligibility exists. No public aggregates/profile/feed/moderation UI.
- Model WatchlistEntry maps physical WatchedList. Nullable unique userId/clientRequestId allows deliberate same-day rewatches.
- Create and watchlist removal atomic; delete does not restore watchlist. All diary access/mutations authorize session user ID.
- Legacy timestamps remain unchanged by schema migration. Preview originals/candidate UTC and user dates; ambiguous rows require explicit reviewed mappings before conversion.
- Keep trusted import-first explicit actions, distinct movieHref routes, discovery debounce/history protections and readable explicit width limits.

## Review Focus

- Retry after an uncertain response must not remove a newly re-added watchlist item or mutate the original log.
- Unrated logs and PUBLIC intent must never leak personal review/count/rating data through movie details or other endpoints.
- UTC−12/UTC+14, leap days and invalid rollover dates must retain date identity and enforce the saved user's today.
- Equal-date viewing pagination must have deterministic ties and owner-scoped cursors under edits/deletes.
- Legacy non-midnight timestamps must survive migration/restore untouched and cannot be silently normalized by a batch.

### Task 1: Shared contract, dates and additive schema

**Files:** Create `app/lib/diary/{contracts,dates,legacy-dates}.ts`, `scripts/diary-dates.ts`, additive phase3 migration; modify `prisma/schema.prisma`, `app/validationSchemas.ts`, diary type reexports; test `tests/diary/contracts.test.ts`, `tests/integration/catalog/catalog.test.ts`.

**Interfaces:** `diaryEntrySchema` parses strict shared payload; `DiaryInput` is inferred output. `calendarDate(Date|string)` serializes UTC date, `todayInTimeZone(zone,now?)`, `parseCalendarDate(value)`, `validateWatchedDate(value,zone,now?)`. User.timeZone nullable means uninitialized, effective UTC. `previewLegacyDates` emits original/candidates/ambiguity; reviewed apply checks originals transactionally.

- [x] Write failing contract/date tests: null/integer scale, empty/trimmed/max review, invalid leap/rollover/timestamps, timezone boundary/future validation, legacy ambiguous previews.
- [x] Run `npm test -- tests/diary`; expect missing implementation/old required-rating failures.
- [x] Implement pure helpers/strict schema; additive SQL nullable rating/default empty review, visibility PRIVATE, flags false, nullable request ID and unique index, nullable saved timezone; rename mapped model and all clients without physical rename.
- [x] Seed historical fixtures before SQL, compare old IDs/values/accounts/links and original timestamps, verify defaults/multiple nullable IDs; backup/restore and compare. Run `npm run test:integration -- tests/integration/catalog/catalog.test.ts` and `npm run test:migrations`; expect preservation and no drift.
- [x] Commit local contract/schema deliverable.

### Task 2: Owner services and authenticated handlers

**Files:** `app/services/{diaryEntryService,watchlistService}.ts`, `app/lib/diary/http.ts`, diary handlers, timezone initialization handler, movieDetailService and detail rating/review consumers; integration `tests/integration/diary.test.ts`.

**Interfaces:** `createDiaryEntry(userId,input,{db?})` returns entry/replayed; unique retries return original. `updateDiaryEntry(userId,id,input)` preserves request identity and an unchanged legacy timestamp; ordinary edits leave watchlist intent intact, actual movie changes use guarded cleanup. `deleteDiaryEntry(userId,id)` scoped delete. `listDiaryEntries(userId,filters)` order watchedDate DESC/id DESC, 20-page keyset, query/year/rating, log/distinct counts. Timezone initialization writes once by updateMany where null; invalid zones reject.

- [x] Write failing real database tests for concurrent same-key creates, same-day new IDs, timezone validation, two owners, replay after watchlist re-add, rollback on watchlist failure and missing movie, edit/delete ownership and no restore, filtered deterministic pagination, no private queries on public movie reads.
- [x] Run targeted integration; expect old behavior failures.
- [x] Implement transaction services, safe errors/serialization, no-store authenticated GET/POST/PATCH/DELETE. Authenticate before parsing. Remove all public diary queries/aggregates until phase4; detail explains community unavailable.
- [x] Run targeted then full units/integration; expect pass. Commit local service deliverable.

### Task 3: One accessible log form and private library

**Files:** Shared `app/diaries/_components/DiaryForm.tsx`, hook, create/edit pages, diary page/list/filter controls and rating consumers. Remove redundant form implementations after moving consumers. Browser/unit diary tests.

**Interfaces:** Form uses DiaryInput, persistent request UUID per mounted draft, initializes timezone before save, preserves draft on failures, defaults private/null/empty, explicit rewatch/spoiler/public intent. Movie details import explicitly then navigate to this form. Diary URL filters q/year/rating/cursor preserve library tabs; counts distinguish all owner logs and distinct movies.

- [x] Write failing form/browser tests for unrated empty log, retry UUID, draft error preservation, flags/visibility edit, same-date rewatch, date stability, filters/pages, keyboard and small viewport.
- [x] Run tests; expect required rating/missing controls failures.
- [x] Consolidate form/hook/types, accessible labeled fields/error focus/loading state; explain automatic watchlist removal and phase4 publication gate. Implement UTC grouping/display, bounded server queries and stable next-page links, independent favorites/watchlist/history. Preserve existing dialogs with focus handling or use accessible native details/confirmation dialog.
- [x] Run complete units and browser tests at 360/768/1440, light/dark/reduced motion; inspect screenshots. Commit UI deliverable.

### Task 4: Final verification and independent review

**Files:** `docs/phase-3-verification.md`, `docs/diary-operations.md`, plan progress.

- [x] Run Prisma generation after own browser server exits; lint/types/full units/integration/migrations/browser/build; full/runtime audits. Expected all pass; record exact failures and corrections.
- [x] Review phase range from 1973d2f independently, with spec/plan/review focus and ledger rulings; fix important findings with RED→GREEN regression and full affected suites.
- [x] Document preservation/restore/date preview evidence, external credential limitations and runtime cancellation limitation. Check approved docs unchanged and original checkout untouched; commit all work locally and leave clean checkout intact.

## Decisions

- Owner authorization supersedes generic planning approval pauses and new-checkout creation. Native execution with a fresh final reviewer.
- Timezone is introduced now solely for date correctness; profile editing/publication/moderation remain phase4.
- Visibility PUBLIC records intent only; no phase3 public diary rendering or aggregate. Explain in form.
- Legacy UTC-midnight records already conform; non-midnight records stay untouched until explicit reviewed conversion. Browser display uses UTC date deterministically in the interim.

## Execution record

- Existing historical catalog SQL/backup harness was extended for phase3 preservation and pre-upgrade restoration; a second migration harness was not duplicated. See the verification report's rulings.
- One independent review of1973d2f..635b36e found four Important issues. Legacy edit preservation, retryable timezone initialization, changed drafts after uncertain creates, and edit watchlist replay were each reproduced failing and fixed. Overlapping movie-change retries also have a real PostgreSQL regression and optimistic guard. No Critical/Minor issues were returned.
- The reviewer set phase4 implementation aside under the approved boundary; public diary suppression was reviewed. Fixes are verified by regression/full suites, without another reviewer dispatch.
