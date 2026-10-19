# Phase 4 verification

2026-10-19. Implemented exclusively in `C:/Users/jlesc/.codex/worktrees/talarama-phase-0/Talarama`, branch `codex/talarama-phase-0`, starting clean at `e83b7c9`. All phase1/2/3 commits remain ancestors. The approved design and roadmap are unchanged. No push, merge, PR publication, deployment, license change, worktree removal or production access occurred.

## Delivered behavior

- Additive profile bio, publication/favorites switches, MEMBER/ADMIN role, moderation state, reports, durable audits and atomic mutation buckets. Existing usernames, IDs/account links, diary values/dates and physical `WatchedList` rows remain intact.
- Owner `/settings/profile` with a strict server allowlist, validated lowercase handle/bio/IANA timezone and refreshed persisted session display. No ID/email/role/image injection. Settings remain accessible while unpublished.
- New neutral unique signup handles with database-conflict retries; no email-derived public handle. Read-only legacy normalization/collision preview and explicit reviewed transactional apply with exclusive journals and durable mapping audit. No automatic populated-data normalization.
- A central eligibility predicate and explicit safe public selections: published owner AND PUBLIC entry AND VISIBLE moderation state. Public member/profile/feed/movie-review/count/rating reads exclude private/unpublished/hidden content. Public DTOs omit viewing dates, emails/account tokens, watchlists and private counts. Favorites require their separate opt-in; public logs and distinct public movies have separate statistics.
- Chronological community activity, 20-entry creation/ID cursor pages, shareable text reviews, paginated movie/profile entries, accessible spoiler reveal, honest empty/rating-only activity and fallback avatars. Local and TMDB movie identities retain phase2 link/import behavior.
- Each member contributes one newest eligible rated entry per movie to the independent Talarama `/5` average/member count. TMDB `/10` remains separately labeled.
- Signed-in unique-per-entry reporting, database-authorized admin queue with stable pages, transactional hide/unhide/resolve audits and operator-only role bootstrap. Hidden entries remain in the owner's diary with moderation state.
- Shared atomic PostgreSQL ten-minute fixed-window limits: diary30, combined favorites/watchlist60, reports5. Bounded expiry cleanup, HTTP429/Retry-After, unchanged idempotent add/remove semantics, completed-create recovery and preserved drafts.
- Dynamic/no-store public/private reads; public views recheck on resume/focus/visibility/privacy events and discard stale visible content. Report drafts live above the eligibility-replaced subtree, keyed by member and entry. Generic noindex member/review metadata avoids retained personal titles.

## Verification record

| Check | Result |
| --- | --- |
| Unit/provider suite | 88 tests in 26 files passed |
| PostgreSQL integration | 34 tests in 3 files passed |
| Historical migrations | 27 replayed; no schema drift |
| Lint / TypeScript | Passed |
| Chromium journeys | All 16 passed in the final full run (2.9 minutes); screenshot-only capture adjustment checked separately |
| Prisma generation / production build | Prisma/client 6.19.3 passed after browser server exit; production build passed compilation, TypeScript and generation of 13 static pages, with community/private routes dynamic |
| Full / runtime dependency audits | Both zero vulnerabilities |
| Independent read-only review | Two Important findings, both reproduced and fixed; no Critical/Minor findings; declined-to-judge list empty |
| Development deploy | Backup first, additive migration applied, eight empty legacy tables unchanged; username preview0/no apply |
| Approved spec/roadmap and phase history | Unchanged/preserved |

Ignored `.superpowers/phase4-*` artifacts retain local logs, screenshots, backup, preview and migration results. They are not published. Tests use synthetic sessions/provider transport and guarded generated schemas, never a production database.

## Preservation and database evidence

The historical harness explicitly excludes phase4 during initial replay, seeds representative old users/accounts/movies/genres/logs/favorites/watchlists, then applies phases1/3/4 SQL. It reads the old schema through SQL before new fields exist. A mixed-case invalid `Legacy.Owner` handle remains exactly unchanged and unpublished. Synthetic account access/refresh values and provider association remain unchanged; a non-midnight `2020-02-29T23:30:00Z` log retains the exact date, text, rating, IDs and links. Both a real pre-upgrade pg_dump restoration followed by additive migrations and a post-upgrade logical restoration compare equal to the migrated fixture snapshot. Historical migration checksums were not edited.

The actual guarded loopback development database was backed up to `.superpowers/phase4-pre-migration-dev.sql`, then deployed without reset. User, Account, Movie, Genre, DiaryEntry, LikedBy, WatchedList and MovieCategorizesAs were all empty before and after, with all selected original values unchanged. The actual username preview contains zero rows; no reviewed mapping was applied there. These empty development results do not establish preservation for unknown production data.

Database regressions cover exact public payload selection, favorite opt-in, reversible publication/visibility/moderation, distinct-log/movie statistics, equal-time/deleted cursor boundaries, newest-rated ties/rewatches/null/private/hidden/unpublished/deleted cases, report uniqueness under concurrent submissions, role spoofing/ordinary-member denial, HTTP no-store/404/429 headers and exact concurrent quota admission. An expired150-row fixture leaves50 after one bounded100-row cleanup. Completed create replay still succeeds at a full quota. All phase3 legacy timestamp, uncertain-create draft recovery, timezone retry and watchlist replay/concurrency tests remain passing.

Actual operator CLI subprocess tests prove preview does not write, existing journals cannot be overwritten, stale reviewed batches roll back, successful mappings leave a durable audit while preserving Google links, and bootstrap requires an exact persisted ID plus explicit grant flag in a guarded local database.

## Independent review and fix pass

A fresh read-only reviewer inspected immutable `e83b7c9..5ecd731` and adjacent consumers against the approved requirements/plan. It did not mutate the checkout or run the database/browser/build suites; verification totals are the implementer's runs. It returned no Critical or Minor findings and declined no behavior as outside scope. Two Important findings were fixed in one pass:

1. Revalidation unmounted report forms and lost unfinished reasons. An actual browser regression failed with expected `Spam report`, received empty string after focus. Page-owned drafts keyed by trusted member/entry now survive content disposal and recheck. GREEN includes retained text after an HTTP429 and a later focus event.
2. The newest-100-only queue stranded older unresolved reports. A real 106-report fixture failed because no next cursor existed. Admin service/API/UI now support stable descending creation/ID pages, keeping both old unresolved and resolved reports reachable for hide/unhide/resolution actions. The regression reaches the oldest report without duplicate IDs.

## Browser and runtime observations

New journeys exercise unpublished settings, publication, persisted session display update, profile/feed/review/movie rechecks after unpublishing, back-navigation to visited community, public payload exclusion, spoilers, report429 draft retention, ordinary-member denial and admin hide/unhide/resolve with retained owner history. Profiles/settings are exercised at360/768/1440, light/dark and reduced motion; spoiler reveal uses keyboard focus/Enter. Screenshots are inspected with `caret:initial`, avoiding the known Playwright style-mutation artifact.

An initial full browser run hit ENOSPC while Next compacted its generated Turbopack cache. The owned run/server was stopped. Only direct generated files inside this worktree's verified cache directory were removed; source, PostgreSQL, backups and all prior planning artifacts were retained. Browser tests now disable persistent compiler disk caching; the same opt-out is available for constrained local build verification. This changes neither TMDB result caching nor auth/privacy behavior.

The next full run passed15/16; discovery's detail-navigation URL assertion timed out at5000ms during uncached compilation. The same test passed unchanged in an isolated diagnostic rerun. That exact navigation assertion now permits15000ms while preserving the expected URL and all prior assertions. The final complete rerun is recorded above after reading its output.

Known Next response-stream cancellation during navigation remains a runtime limitation inherited from prior phases; passing journeys do not establish a console-error-free runtime. Node color-environment and upstream ESLint peer-metadata warnings remain documented. No engine DLL was force-deleted or unrelated process terminated.

## Rulings and external limits

- Generic noindex member/review metadata in v1 avoids stale personal titles after privacy changes. Cost if revisited: public journal indexing is deferred until a separately reviewed indexing/revalidation design.
- Optional compiler disk-cache opt-out is used for disposable browser and constrained local build runs. Cost: colder local compilation; content/provider cache semantics are unchanged.

`TMDB_READ_TOKEN`, `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` remain absent under Next's actual environment loader. Real-token provider search/details/import and genuine Google OAuth remain unverified. No credentials were printed, fabricated or requested as nonexistent old values. Fixtures prove local application contracts only. Production staging preservation, deployment and public-launch checks remain phase5 work.

See [community operations](community-operations.md), [migration safety](migrations.md) and the [execution plan](superpowers/plans/2026-10-19-phase-4-execution.md). The branch/worktree and ignored backups remain intact for subsequent owner work.
