# Local TMDB Retention Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans and test-driven-development. The owner authorized local retention work on disposable fixtures, preservation of IDs/member data, and a localhost preview. No further design pause, external writes, licensing decision or real-data purge is authorized.

**Goal:** Rehearse preview, refresh, expiry, termination and uncertain-outcome recovery with real PostgreSQL while preventing this operator tool from targeting existing databases/schemas.

**Architecture:** An operator-only fixture scope creates a new random `retention_<UUID>` schema in a loopback `_test` DB. It uses the current Prisma schema plus fixture-local ownership/audit tables, never a production migration. Explicit provenance fingerprints identify synthetic provider-owned metadata; unknown/legacy rows are reported for review and untouched. Provider calls use injected synthetic trusted TMDB transport. The normal app, schema/migrations, import/read/cache/privacy behavior stay unchanged.

**Spec:** Approved community design/roadmap plus the owner's explicit retention authorization and `docs/tmdb-attribution.md`. Licensing stays pending; initial release intent is noncommercial.

## Constraints and decisions

- Same existing checkout/branch, based on `ca021e3`; no push/merge/deploy, new checkout, development migration or real-data access.
- Proposed conservative windows: refresh at150 days, expire at180 elapsed UTC days. These are implementation defaults for rehearsal, not account-specific legal clearance.
- Retire only verified provider-owned movie fields and provider genre associations. Preserve Movie/Genre IDs, Google links, users, diary content/exact timestamps, favorites and physical watchlist relationships. Provider-only orphan genre labels become neutral placeholders while their IDs remain. Shared/unknown genre ownership requires review.
- No provenance is inferred from `tmdbId` or timestamps alone. Null/future dates, stale fingerprints and unknown source require review. A checked legacy mapping cannot become proof of provider ownership.
- Preview/report/audit contain IDs, times, hashes and safe outcomes, never copied movie payloads/member content/tokens. All batch updates and durable fixture audit commit together. Stable UUID retries recover the original outcome without refetching/repeating writes.
- The runner creates and removes only its own generated schema. No CLI accepts an existing schema, production override or arbitrary provider credentials. Normal runtime never imports it.
- Shared Next/image caches, exported backups, production provenance/backfill, scheduling and activation remain separately reviewed release gates. A DB fixture rehearsal cannot claim those real systems were purged.

## Task 1: Policy and guarded disposable scope

**Files:** `scripts/lib/tmdb-retention-policy.ts`, `scripts/lib/tmdb-retention-fixtures.ts`, `tests/catalog/retention-policy.test.ts`.

- [x] Write policy/URL tests:150/180-day exact boundaries, invalid/future/null time, unknown/legacy provenance, termination without refresh; refuse remote/dev/public/existing schema targets and secret-bearing errors. Run RED.
- [x] Implement `retentionAction(lastFetchedAt, ownership, mode, now)`, fingerprinting, and factory accepting only loopback `_test` URL and creating its own random schema. No default DATABASE_URL. Verify GREEN.

## Task 2: Transactional refresh/retirement and recovery

**Files:** fixture service above; `tests/integration/retention.test.ts`.

- [x] Write PostgreSQL tests RED for read-only preview; failed pre-expiry refresh retains snapshot; expired refresh success/failure; termination with no upstream call; unknown/mixed legacy protection; exact member/ID/link/timestamp preservation; managed genre cleanup; stale-plan whole-batch rollback; malformed/provider-ID mismatch rejection; durable idempotent lost-response replay and later fresh recovery.
- [x] Implement fixture-local ownership/audit, provider staging outside transaction, whole-batch optimistic fingerprint checks, atomic metadata-only changes and safe durable outcomes. Fresh trusted provider details replace only owned fields; retirement uses a neutral title/null provider fields and retains every member record.
- [x] Run focused integration GREEN and full integration/unit/migration/lint/types checks. Inspect count/identity comparisons.

## Task 3: Repeatable rehearsal, documentation and review

**Files:** `scripts/tmdb-retention-rehearsal.ts`, `package.json`, `docs/tmdb-retention-local.md`, attribution/deployment verification updates.

- [x] Add `npm run retention:rehearse` using synthetic transport only, exclusive report output and disposable-scope cleanup. Report a run/replay and member-data equality without printing URLs or secrets. Existing output paths must fail before DB work.
- [x] Document fresh fixture provenance, expiry/retry/conflict behavior and production cache/backup/activation limits. Record noncommercial intent and pending licensing without changing root LICENSE.
- [x] Obtain one independent read-only review of this local change; reproduce material findings before fixes. Run appropriate final checks, commit locally, leave branch clean.
- [x] Keep/open localhost preview from a separate disposable schema; normal app uses no auth bypass, fake production reviews or genuine provider credentials. Stop only owned preview before generation/build; restart afterward and leave it available.

## Review focus

- Scope guards must prevent accidental real-data mutation; metadata/date/ID alone is not provenance.
- A stale reviewed plan or concurrent refresh cannot retire newer metadata; batch/audit must be atomic and replays stable.
- Expired provider payload must not be copied into audit/report or retained in owned genre labels; unknown/shared ownership is explicit review.
- Member data and every old timestamp/link must survive expiry, termination, repeat and recovery.
- Local evidence must not imply production cache/backup purge, provider acceptance, licensing approval or release activation.

## Ledger

- Preflight clean `ca021e3`, branch unchanged, approximately9.5GB free. Existing loopback PostgreSQL running. No development data touched.
- Current app opened and visibly inspected at127.0.0.1:3000; synthetic discovery API200 and synthetic community fixture available. Preview uses a separate generated `preview_<UUID>` schema, test-only transport and blank Google credentials. No genuine login/live-provider acceptance claimed.
- Ruling: keep production schema/runtime untouched and put provenance/audit only inside the generated fixture schema; unknown existing metadata cannot safely be classified automatically. Cost: production activation/provenance migration and cache/backup integration remain explicit future gates.
- Completed fixture-only implementation in d6b5a5a. One independent read-only review found two Important issues: genre inventory outside the reviewed plan and the audit-miss/preflight replay race. Both were reproduced, corrected in one fix pass and verified; no Critical or material Minor findings. Detailed evidence and all declined-area rulings are in `docs/tmdb-retention-verification.md`.
- Final current checks:94 unit tests in28 files,49 PostgreSQL tests in4 files, typecheck and lint all passed. Existing27 migrations replayed without drift; schema/application/dependencies were unchanged by this work. Isolated deterministic replay regression fails on the reviewed baseline and passes on the restored fix. Actual CLI preservation, exclusive report path, replay and no-call termination checks pass in the integration suite.
- Ruling: bind the entire fixture genre inventory and termination state to the reviewed plan. Cost: unrelated fixture metadata/genre changes require a new preview. Recover matching durable UUID outcomes after a concurrent commit; reject UUID reuse with another plan. Keep all production/cache/backup/licensing/live-provider gates pending.
- Localhost discovery and synthetic catalog return HTTP200. The visible in-app preview is intentionally left running in its separate owned schema. No build or browser-journey rerun is claimed for this operator-only change; the existing phase5 build serves the preview.
