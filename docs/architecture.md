# Architecture and engineering decisions

Talarama extends its original Next.js application: React components → Next route handlers/server components → feature services → Prisma/PostgreSQL or the server-only TMDB boundary. Google/NextAuth JWT sessions identify a persisted user; account links and authorization remain in PostgreSQL. See [dependencies](dependencies.md) for installed versions and compatibility overrides.

## Movie identity and ownership

`Movie.id` is permanent local identity. Nullable unique `tmdbId` identifies the provider record. `movieHref` preserves `/movies/[id]` for unmatched legacy titles and uses `/movies/tmdb/[tmdbId]` for provider/mapped titles. Same title/year is not identity. Search/detail reads never import. Explicit authenticated saves/logs fetch trusted metadata through internal `importMovie`, then use the local ID; browser title/artwork fields are untrusted. Concurrent imports converge without merging existing records.

TMDB owns its service and supplies metadata/artwork under upstream terms. Talarama stores member identities, diaries, library relationships, visibility and moderation separately. Source-code licensing cannot grant rights to upstream material. See [attribution and retention gates](tmdb-attribution.md).

`app/lib/tmdb/server.ts` caches validated normalized search/discovery/details for 300/3600/86400 seconds. The client restricts endpoints, non-adult results, response size and a five-second deadline. Failed refreshes retain saved snapshots. Personal/public-eligibility reads never enter that cache. Persistent snapshots require the separate retention gate before release.

## Diary consistency

`app/lib/diary/contracts.ts` is the shared form/API contract: local movie ID, actual YYYY-MM-DD date, null or integer 1–5 rating, trimmed 0–2000-character review, flags, PRIVATE/PUBLIC and UUID request identity. New/explicitly changed dates store UTC midnight; serialization/display use UTC calendar date. Future validation uses the saved IANA zone (browser initialization once, UTC fallback). An unchanged displayed day preserves the exact legacy timestamp, including non-midnight values. No timezone intent is guessed.

Create and watchlist removal are one transaction. Nullable unique `(userId,clientRequestId)` converges retries while allowing deliberate rewatches. Replay returns the original without removing a newly re-added watchlist item. Ordinary edits preserve watchlists; actual movie changes use optimistic movie/date guards; conflicts return409. Delete does not restore watchlist. `WatchlistEntry` maps the physical `WatchedList`; history comes from logs, favorites remain independent.

After a lost response, the form retains the first payload/UUID and latest draft separately. It recovers the original entry first, preserves later edits and requires an explicit Update Entry to save them to that recovered ID. No guessed new UUID/navigation can discard the latest draft. See [diary operations](diary-operations.md).

## Identity, publication and moderation

Authorization uses the persisted session user ID. Profile updates have a strict allowlist; neutral new handles use database uniqueness retries. Existing handles/account links are preserved until reviewed mapping. New profiles/favorites are unpublished by default.

`publicEntryService.ts` centralizes eligibility: published profile AND PUBLIC diary entry AND VISIBLE moderation. Every public feed/profile/movie/review/count/rating query uses it. Explicit DTOs exclude emails, provider tokens, watched dates, private counts and watchlists; favorites require separate opt-in. Public/private responses are dynamic/no-store. Clients clear old public data and recheck on resume/focus/visibility/privacy events. Already received copies cannot be recalled.

Feeds use stable descending `(createdAt,id)` cursor pages of20; owner diary uses watchedDate/ID. Live pages are not cross-request snapshots. Only text entries have review URLs; spoiler reveal uses native disclosure. Public log/distinct-film statistics are distinct. Talarama `/5` counts each member's newest eligible rated viewing once; TMDB `/10` stays separate. Generic noindex member/review metadata deliberately avoids retained personal titles.

Reports are unique per reporter/entry. Persisted ADMIN authorization gates paginated moderation and atomic audit writes. Hidden entries remain in the owner's diary. PostgreSQL atomic ten-minute buckets admit30 diary writes,60 combined library writes and5 reports/member; bounded expiry cleanup and429 retry information preserve drafts. Completed-create recovery remains possible at quota. See [community operations](community-operations.md).

## Verification boundary

Vitest covers contracts, caches, hooks and routes. Integration suites use disposable PostgreSQL schemas, real SQL, concurrency and real `pg_dump`/`psql` pre/post restorations. Playwright uses synthetic JWTs and a test-server-only TMDB transport preload through the real validation/cache/import path. Production imports no fixture code and starts with no fake community activity. Fixtures do not establish Google/TMDB service acceptance, staging-data preservation or hosted CI success. [Deployment gates](deployment.md) describe the remaining checks.
